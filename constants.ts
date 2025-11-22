import { Transaction, Loan, Account, Budget, Goal, Subscription, Invoice, DashboardWidget, Investment, Debt, RecurringTransaction } from './types';

export const INCOME_CATEGORIES = [
  'Stipendio', 'Investimenti', 'Freelance', 'Regali', 'Altro'
];

export const EXPENSE_CATEGORIES = [
  'Casa', 'Cibo', 'Trasporti', 'Finanziamenti', 'Debiti', 'Svago', 'Salute', 'Abbonamenti', 'Shopping', 'Tasse', 'Contributi INPS', 'Servizi Web', 'Altro'
];

export const INVESTMENT_CATEGORIES = [
    'Stocks', 'Crypto', 'ETF', 'Real Estate', 'Commodities', 'Other'
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_1',
    name: 'Intesa Sanpaolo',
    type: 'bank',
    initialBalance: 3500,
    balance: 3500,
    color: 'blue'
  },
  {
    id: 'acc_2',
    name: 'Portafoglio Contanti',
    type: 'cash',
    initialBalance: 120,
    balance: 120,
    color: 'emerald'
  },
  {
    id: 'acc_3',
    name: 'Amex Gold',
    type: 'credit_card',
    initialBalance: -450,
    balance: -450, // Credit cards usually have negative balance representing debt
    color: 'amber'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    amount: 2500,
    type: 'income',
    category: 'Stipendio',
    description: 'Stipendio Mensile',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    accountId: 'acc_1'
  },
  {
    id: '2',
    amount: 120,
    type: 'expense',
    category: 'Cibo',
    description: 'Spesa Supermercato',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    accountId: 'acc_3' // Paid with Credit Card
  },
  {
    id: '3',
    amount: 45,
    type: 'expense',
    category: 'Svago',
    description: 'Cinema e Pizza',
    date: new Date().toISOString(),
    accountId: 'acc_2' // Paid with Cash
  },
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: '1',
    name: 'Rata Auto',
    totalAmount: 15000,
    remainingAmount: 8500,
    monthlyPayment: 250,
    interestRate: 4.5,
    nextPaymentDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    reminderEnabled: true
  }
];

export const INITIAL_DEBTS: Debt[] = [
  {
      id: 'd1',
      creditorName: 'Mario Rossi',
      amount: 50,
      description: 'Cena offerta sabato',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      isPaid: false
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Cibo', limit: 400 },
  { category: 'Svago', limit: 200 },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'g1',
    name: 'Viaggio in Giappone',
    targetAmount: 3500,
    currentAmount: 1200,
    deadline: '2025-06-01',
    color: 'rose'
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 's1',
    name: 'Netflix Premium',
    cost: 17.99,
    frequency: 'monthly',
    nextPaymentDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    category: 'Abbonamenti',
    active: true
  },
  {
    id: 's2',
    name: 'Spotify Duo',
    cost: 12.99,
    frequency: 'monthly',
    nextPaymentDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    category: 'Abbonamenti',
    active: true
  },
  {
    id: 's3',
    name: 'Amazon Prime',
    cost: 49.90,
    frequency: 'yearly',
    nextPaymentDate: '2025-09-15T00:00:00.000Z',
    category: 'Abbonamenti',
    active: true
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    number: '1/2025',
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 20).toISOString(),
    entityName: 'Studio Legale Rossi',
    amount: 1500,
    type: 'issued',
    status: 'sent',
    category: 'Freelance'
  },
  {
    id: 'inv_2',
    number: 'A-402',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 28).toISOString(),
    entityName: 'Hosting Provider SpA',
    amount: 120,
    type: 'received',
    status: 'paid',
    category: 'Servizi Web',
    linkedTransactionId: 'tx_hosting_initial'
  }
];

export const INITIAL_INVESTMENTS: Investment[] = [
    {
        id: 'inv_1',
        name: 'Bitcoin',
        symbol: 'BTC',
        category: 'Crypto',
        quantity: 0.05,
        averageBuyPrice: 35000,
        currentPrice: 62000,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'inv_2',
        name: 'S&P 500 ETF',
        symbol: 'VUAA',
        category: 'ETF',
        quantity: 50,
        averageBuyPrice: 75.50,
        currentPrice: 88.20,
        lastUpdated: new Date().toISOString()
    }
];

export const INITIAL_RECURRING_TRANSACTIONS: RecurringTransaction[] = [];

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'w1', label: 'Carte Sommaria (Netto, Entrate, Spese)', componentId: 'summary_cards', colSpan: 'full', visible: true, order: 1 },
  { id: 'w2', label: 'Ripartizione Spese (Torta)', componentId: 'expense_pie', colSpan: '1', visible: true, order: 2 },
  { id: 'w3', label: 'Stato Patrimoniale (Asset vs Debiti)', componentId: 'net_worth_pie', colSpan: '1', visible: true, order: 3 },
  { id: 'w4', label: 'Entrate vs Spese', componentId: 'income_vs_expense', colSpan: '1', visible: true, order: 4 },
  { id: 'w5', label: 'Andamento Annuale (5 Anni)', componentId: 'yearly_trend', colSpan: '3', visible: true, order: 5 },
  { id: 'w6', label: 'Budget Rapido', componentId: 'quick_budgets', colSpan: '1', visible: true, order: 6 },
  { id: 'w7', label: 'Obiettivi', componentId: 'quick_goals', colSpan: '1', visible: true, order: 7 },
  { id: 'w8', label: 'Azioni Rapide', componentId: 'actions', colSpan: 'full', visible: true, order: 8 },
  { id: 'w9', label: 'Ultime Transazioni', componentId: 'recent_transactions', colSpan: '2', visible: true, order: 9 },
  { id: 'w10', label: 'Prossima Tassa', componentId: 'tax_deadline', colSpan: '1', visible: true, order: 10 },
  { id: 'w11', label: 'Debito Totale (Monitor)', componentId: 'debt_summary', colSpan: '1', visible: true, order: 11 },
];