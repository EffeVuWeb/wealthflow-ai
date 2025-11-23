import { GoogleGenAI } from "@google/genai";
import { Transaction, FinancialSummary, Loan, Account, Subscription, Invoice, Investment, Debt } from "../types";
import { EXPENSE_CATEGORIES } from "../constants";

// Remove global initialization
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getAIClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const extractTransactionFromImage = async (base64Image: string): Promise<{ amount: number, date: string, description: string, category: string } | null> => {
  try {
    const ai = getAIClient();
    if (!ai) return null;

    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          {
            text: `Analyze this receipt/invoice image. Extract the following details in JSON format:
                      - "amount": The total amount (number).
                      - "date": The date of purchase in YYYY-MM-DD format. If not found, use today's date.
                      - "description": The merchant name or brief description.
                      - "category": Choose the best fitting category from this list: ${EXPENSE_CATEGORIES.join(', ')}. If unsure, use "Altro".
                      
                      Return ONLY the JSON object, no markdown formatting.`
          }
        ]
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    return null;
  }
};

export const parseVoiceTransaction = async (text: string): Promise<{ amount: number, category: string, description: string } | null> => {
  try {
    const ai = getAIClient();
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `You are a financial assistant. Analyze this spoken transaction text: "${text}".
            Extract the following fields into a valid JSON object:
            - "amount": number (e.g. 20).
            - "description": string (short description).
            - "category": string (one of: ${EXPENSE_CATEGORIES.join(', ')}). Use "Altro" if unclear.

            Examples:
            Input: "20 euro benzina" -> {"amount": 20, "description": "Benzina", "category": "Trasporti"}
            Input: "pranzo 15" -> {"amount": 15, "description": "Pranzo", "category": "Cibo"}

            Return ONLY the JSON. Do not use markdown formatting.`
          }
        ]
      }
    });

    let responseText = response.text || "";
    // Clean up potential markdown code blocks
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Error parsing voice transaction:", error);
    return null;
  }
};

export const getFinancialAdvice = async (
  userMessage: string,
  transactions: Transaction[],
  summary: FinancialSummary,
  loans: Loan[],
  accounts: Account[],
  subscriptions: Subscription[] = [],
  invoices: Invoice[] = [],
  investments: Investment[] = [],
  debts: Debt[] = []
): Promise<string> => {
  try {
    const ai = getAIClient();
    if (!ai) return "Per utilizzare il Coach AI, devi configurare una API Key di Google Gemini.";

    // Calculate debt metrics
    const totalLoanDebt = loans.reduce((acc, l) => acc + l.remainingAmount, 0);
    const monthlyDebtCommitment = loans.reduce((acc, l) => acc + l.monthlyPayment, 0);
    const totalPersonalDebt = debts.filter(d => !d.isPaid).reduce((acc, d) => acc + d.amount, 0);

    const liquidAssets = accounts
      .filter(a => a.type === 'bank' || a.type === 'cash')
      .reduce((acc, curr) => acc + curr.balance, 0);

    const creditCardDebt = accounts
      .filter(a => a.type === 'credit_card')
      .reduce((acc, curr) => acc + curr.balance, 0); // Usually negative

    // Investment Analysis
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const investmentAllocation = investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + (inv.quantity * inv.currentPrice);
      return acc;
    }, {} as Record<string, number>);

    const debtToIncomeRatio = summary.totalIncome > 0
      ? ((monthlyDebtCommitment / summary.totalIncome) * 100).toFixed(1)
      : "N/A";

    // Subscriptions analysis
    const monthlyFixedSubs = subscriptions.reduce((acc, sub) => {
      if (!sub.active) return acc;
      return acc + (sub.frequency === 'monthly' ? sub.cost : sub.cost / 12);
    }, 0);

    const yearlyFixedSubs = monthlyFixedSubs * 12;

    // Business Analysis
    const currentYear = new Date().getFullYear();
    const businessTxs = transactions.filter(t => t.isBusiness && new Date(t.date).getFullYear() === currentYear);
    const businessRevenue = businessTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    // In Forfettario, only "Contributi INPS" are deductible
    const deductibleExpenses = businessTxs.filter(t => t.type === 'expense' && t.category === 'Contributi INPS').reduce((s, t) => s + t.amount, 0);
    const otherBusinessExpenses = businessTxs.filter(t => t.type === 'expense' && t.category !== 'Contributi INPS').reduce((s, t) => s + t.amount, 0);

    // Invoices Analysis
    const unpaidInvoices = invoices.filter(i => i.type === 'issued' && i.status !== 'paid');
    const outstandingCredit = unpaidInvoices.reduce((s, i) => s + i.amount, 0);
    const unpaidBills = invoices.filter(i => i.type === 'received' && i.status !== 'paid');
    const outstandingDebt = unpaidBills.reduce((s, i) => s + i.amount, 0);

    // Calculate Category Breakdown for the AI
    const categoryBreakdown: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

    // Sort transactions by date to help AI see timeline
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Construct a context-aware system instruction
    const contextData = JSON.stringify({
      currentDate: new Date().toISOString().split('T')[0],
      netWorth: summary.netWorth,
      monthlyFlow: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        balance: summary.balance,
        savingsRate: summary.savingsRate.toFixed(1) + '%',
      },
      businessMetrics: {
        year: currentYear,
        grossRevenueIncassato: businessRevenue,
        deductibleINPSVersati: deductibleExpenses,
        nonDeductibleExpenses: otherBusinessExpenses,
        grossProfit: businessRevenue - otherBusinessExpenses,
        outstandingClientInvoices: outstandingCredit,
        unpaidSupplierBills: outstandingDebt,
        limit85kStatus: (businessRevenue / 85000 * 100).toFixed(1) + '%',
        note: "Profile: Web Designer, Regime Forfettario (Flat Tax 15% or 5%, Coefficient 78%)"
      },
      fixedCosts: {
        monthlySubscriptions: monthlyFixedSubs,
        yearlySubscriptionsProjection: yearlyFixedSubs,
        subscriptionList: subscriptions.map(s => `${s.name} (${s.cost} ${s.frequency})`)
      },
      assets: {
        liquidCash: liquidAssets,
        investmentsTotal: totalInvested,
        accountsBreakdown: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance })),
        investmentAllocation: investmentAllocation
      },
      liabilities: {
        loansTotal: totalLoanDebt,
        personalDebtsTotal: totalPersonalDebt,
        creditCardBalance: creditCardDebt,
        monthlyLoanPayments: monthlyDebtCommitment,
        activeLoans: loans.map(l => ({ name: l.name, remaining: l.remainingAmount })),
        activeDebts: debts.filter(d => !d.isPaid).map(d => ({ to: d.creditorName, amount: d.amount }))
      },
      spendingAnalysis: {
        categoryTotals: categoryBreakdown
      },
      recentTransactions: sortedTransactions.slice(0, 60).map(t => ({
        date: t.date.split('T')[0],
        type: t.type,
        amount: t.amount,
        category: t.category,
        desc: t.description,
        isBusiness: t.isBusiness
      }))
    });

    const systemInstruction = `
      Sei "WealthFlow Coach", un commercialista e consulente finanziario esperto in fiscalità italiana (Regime Forfettario) e gestione patrimoniale.
      L'utente è un Web Designer con Partita IVA Forfettaria (Codice Ateco 74.10.21).
      
      DATI UTENTE:
      ${contextData}
      
      LE TUE REGOLE FISCALI (CRITICHE):
      1. **Regime Forfettario & Deduzioni**: Le spese business NON si scaricano (il coefficiente è fisso al 78%). L'unica cosa che abbassa le tasse sono i "Contributi INPS" effettivamente PAGATI.
      2. **Limite 85k**: Controlla 'grossRevenueIncassato'. Se >85k, avvisa che uscirà dal regime l'anno prossimo.
      3. **CODICI TRIBUTO (F24)**: Quando parli di pagamenti, usa sempre i codici corretti:
         - **1790**: Imposta Sostitutiva - SALDO.
         - **1791**: Imposta Sostitutiva - I ACCONTO.
         - **1792**: Imposta Sostitutiva - II ACCONTO.
         - **PXX / P10**: Contributi INPS Gestione Separata (Saldo/Acconto).
      4. **Come Pagare**: Spiega che si paga tramite Modello F24 sul sito dell'Agenzia delle Entrate o tramite Home Banking.

      LE TUE REGOLE DI INVESTIMENTO E DEBITO:
      - Se l'utente ha "personalDebtsTotal" > 0, suggerisci di saldarli prima di investire.
      - Se l'utente ha molta liquidità (liquidCash) e pochi investimenti (investmentsTotal), suggerisci di valutare PAC (Piani Accumulo).
      - Analizza l'asset allocation (es. "Troppe Crypto" o "Poco Azionario").
      - Non dare consigli finanziari vincolanti (usa sempre disclaimer "Non è una consulenza finanziaria").

      QUANDO RISPONDI:
      - Sii pragmatico: calcola le tasse basandoti su: (Incassato * 78% - INPS Versati) * 5% (o 15%).
      - Ricorda: Le tasse si pagano sul principio di CASSA (solo incassato), non competenza.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Mi dispiace, non riesco a generare un consiglio al momento.";
  } catch (error) {
    console.error("Error fetching advice from Gemini:", error);
    return "C'è stato un problema di connessione con il Coach. Riprova più tardi.";
  }
};

export const generateForecast = async (
  monthlyIncome: number,
  monthlyExpenses: number,
  balance: number,
  savingsRate: number
): Promise<string> => {
  try {
    const ai = getAIClient();
    if (!ai) return "Configura la chiave API per vedere le previsioni AI.";

    const prompt = `
            Act as a financial forecaster.
            User Data:
            - Monthly Income: €${monthlyIncome}
            - Monthly Expenses: €${monthlyExpenses}
            - Current Balance: €${balance}
            - Savings Rate: ${savingsRate}%

            Task:
            Generate a short, 2-sentence insight about their future financial health over the next 6 months.
            Be specific (e.g., "At this rate, you will save X").
            Warn if they are at risk of going negative.
            Use a professional but encouraging tone in Italian.
        `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] }
    });

    return response.text || "Impossibile generare previsione.";
  } catch (error) {
    console.error("Forecast error:", error);
    return "Errore nella generazione della previsione.";
  }
};