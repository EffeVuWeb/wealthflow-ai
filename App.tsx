import React, { useState, useMemo, useEffect } from 'react';
import { AppView, Transaction, FinancialSummary, Loan, Account, Budget, Goal, Subscription, Invoice, DashboardWidget, Investment, Debt, RecurringTransaction, ToastMessage, ToastType, AutomationRule } from './types';
import { INITIAL_TRANSACTIONS, INITIAL_LOANS, INITIAL_ACCOUNTS, INCOME_CATEGORIES, EXPENSE_CATEGORIES, INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_SUBSCRIPTIONS, INITIAL_INVOICES, DEFAULT_WIDGETS, INITIAL_INVESTMENTS, INITIAL_DEBTS, INITIAL_RECURRING_TRANSACTIONS } from './constants';
import SummaryCard from './components/SummaryCard';
import AddTransactionModal from './components/AddTransactionModal';
import CoachView from './components/CoachView';
import LoansView from './components/LoansView';
import DebtsView from './components/DebtsView';
import AccountsView from './components/AccountsView';
import BudgetsView from './components/BudgetsView';
import GoalsView from './components/GoalsView';
import SubscriptionsView from './components/SubscriptionsView';
import SubscriptionModal from './components/SubscriptionModal';
import TaxesView from './components/TaxesView';
import InvoicesView from './components/InvoicesView';
import ForecastView from './components/ForecastView';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import InvestmentsView from './components/InvestmentsView';
import RecurringView from './components/RecurringView';
import GamificationView from './components/GamificationView';
import AutomationsView from './components/AutomationsView';
import { calculateBadges } from './services/gamificationService';
import { useAutomations } from './hooks/useAutomations';
import BottomNavigation from './components/BottomNavigation';
import DashboardCustomizer from './components/DashboardCustomizer';
import Toast from './components/Toast';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useSupabase } from './hooks/useSupabase';
import { useNotifications } from './hooks/useNotifications';
import {
    LayoutDashboard,
    List,
    Bot,
    Plus,
    Trash2,
    Landmark,
    WalletCards,
    Filter,
    RotateCcw,
    Search,
    Repeat,
    Download,
    Eye,
    EyeOff,
    CalendarClock,
    Briefcase,
    Receipt,
    LineChart,
    CalendarDays,
    Settings,
    BarChart as BarChartIcon,
    Layout,
    TrendingUp,
    Lock,
    HandCoins,
    TrendingDown,
    Clock,
    AlertCircle,
    Zap,
    Menu,
    Trophy,
    X
} from './components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

// Define explicit colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1'];

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const { fetchData, addData, updateData, deleteData } = useSupabase();

    const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
    const [privacyMode, setPrivacyMode] = useState(false);

    const handleNavClick = (view: AppView) => {
        setActiveView(view);
        setIsMobileMenuOpen(false);
    };

    // Security State
    const [isLocked, setIsLocked] = useState(false);
    const [pinInput, setPinInput] = useState('');

    // Toast State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handlePinUnlock = () => {
        const storedPin = localStorage.getItem('wf_security_pin');
        if (pinInput === storedPin) {
            setIsLocked(false);
            setPinInput('');
        } else {
            addToast("PIN Errato", "error");
            setPinInput('');
        }
    };

    // Transactions State
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Recurring Rules State
    const [recurringRules, setRecurringRules] = useState<RecurringTransaction[]>([]);

    // Loans State
    const [loans, setLoans] = useState<Loan[]>([]);

    // Debts State
    const [debts, setDebts] = useState<Debt[]>([]);

    // Accounts State
    const [accountsState, setAccountsState] = useState<Account[]>([]);

    // Budgets State
    const [budgets, setBudgets] = useState<Budget[]>([]);

    // Goals State
    const [goals, setGoals] = useState<Goal[]>([]);

    // Subscriptions State
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

    // Invoices State
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Investments State
    const [investments, setInvestments] = useState<Investment[]>([]);

    // Automation Rules State
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);

    // Dashboard Widgets State
    const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterMinAmount, setFilterMinAmount] = useState('');
    const [filterMaxAmount, setFilterMaxAmount] = useState('');
    const [filterSearch, setFilterSearch] = useState('');

    // --- HOOKS ---

    // 1. Calculated Accounts
    const accounts = useMemo(() => {
        return accountsState.map(acc => {
            const accountTransactions = transactions.filter(t => t.accountId === acc.id);
            const totalFlow = accountTransactions.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            return {
                ...acc,
                balance: acc.initialBalance + totalFlow
            };
        });
    }, [accountsState, transactions]);

    // 2. Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const txDate = new Date(tx.date);
            if (filterStartDate) {
                const start = new Date(filterStartDate);
                start.setHours(0, 0, 0, 0);
                if (txDate < start) return false;
            }
            if (filterEndDate) {
                const end = new Date(filterEndDate);
                end.setHours(23, 59, 59, 999);
                if (txDate > end) return false;
            }
            if (filterCategory && tx.category !== filterCategory) return false;
            if (filterMinAmount && tx.amount < parseFloat(filterMinAmount)) return false;
            if (filterMaxAmount && tx.amount > parseFloat(filterMaxAmount)) return false;
            if (filterSearch && !tx.description.toLowerCase().includes(filterSearch.toLowerCase())) return false;
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filterStartDate, filterEndDate, filterCategory, filterMinAmount, filterMaxAmount, filterSearch]);

    // 3. Transaction Chart Data
    const transactionChartData = useMemo(() => {
        const data: Record<string, { date: string, income: number, expense: number }> = {};
        const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sorted.forEach(t => {
            const dateKey = new Date(t.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
            if (!data[dateKey]) {
                data[dateKey] = { date: dateKey, income: 0, expense: 0 };
            }
            if (t.type === 'income') data[dateKey].income += t.amount;
            else data[dateKey].expense += t.amount;
        });
        return Object.values(data).slice(-20);
    }, [filteredTransactions]);

    // 4. Summary Calculations
    const summary: FinancialSummary = useMemo(() => {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
        const balance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
        const totalLiquidAssets = accounts.reduce((acc, curr) => acc + curr.balance, 0);
        const totalInvestments = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
        const totalLiabilities = loans.reduce((acc, curr) => acc + curr.remainingAmount, 0);
        const totalPersonalDebts = debts.filter(d => !d.isPaid).reduce((acc, d) => acc + d.amount, 0);

        return {
            totalIncome,
            totalExpense,
            balance,
            savingsRate,
            netWorth: (totalLiquidAssets + totalInvestments) - totalLiabilities - totalPersonalDebts,
            investmentsValue: totalInvestments
        };
    }, [transactions, accounts, loans, debts, investments]);

    const comparisonData = [
        { name: 'Entrate', value: summary.totalIncome },
        { name: 'Spese', value: summary.totalExpense },
    ];

    // 5. Chart Data for Widgets
    const yearlyComparisonData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
        return years.map(year => {
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31, 23, 59, 59);
            const yearTxs = transactions.filter(t => {
                const d = new Date(t.date);
                return d >= yearStart && d <= yearEnd;
            });
            const income = yearTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = yearTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            return { year: year.toString(), Entrate: income, Spese: expense };
        });
    }, [transactions]);

    const expenseData = useMemo(() => {
        const data: Record<string, number> = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            data[t.category] = (data[t.category] || 0) + t.amount;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [transactions]);

    const assetLiabilityData = useMemo(() => {
        const liquid = accounts.filter(a => a.type === 'bank' || a.type === 'cash').reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
        const investmentVal = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
        const ccDebt = accounts.filter(a => a.type === 'credit_card' && a.balance < 0).reduce((acc, c) => acc + Math.abs(c.balance), 0);
        const loanDebt = loans.reduce((acc, l) => acc + l.remainingAmount, 0);
        const personalDebt = debts.filter(d => !d.isPaid).reduce((acc, d) => acc + d.amount, 0);
        const bankOverdraft = accounts.filter(a => a.type === 'bank' && a.balance < 0).reduce((acc, c) => acc + Math.abs(c.balance), 0);

        return [
            { name: 'Liquidità', value: liquid, color: '#10b981' },
            { name: 'Investimenti', value: investmentVal, color: '#8b5cf6' },
            { name: 'Debiti', value: ccDebt + loanDebt + personalDebt + bankOverdraft, color: '#f43f5e' }
        ];
    }, [accounts, loans, debts, investments]);

    // 6. Next Tax Deadline
    const nextTaxDeadline = useMemo(() => {
        const year = new Date().getFullYear();
        const today = new Date();
        const deadlines = [new Date(`${year}-06-30`), new Date(`${year}-11-30`)];
        let next = deadlines.find(d => d >= today);
        if (!next) next = new Date(`${year + 1}-06-30`);
        const daysLeft = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { date: next, daysLeft };
    }, []);

    // 7. Total Debt Summary
    const totalDebtSummary = useMemo(() => {
        const loansTotal = loans.reduce((acc, l) => acc + l.remainingAmount, 0);
        const debtsTotal = debts.filter(d => !d.isPaid).reduce((acc, d) => acc + d.amount, 0);
        return loansTotal + debtsTotal;
    }, [loans, debts]);

    // 8. Security PIN Check
    useEffect(() => {
        const storedPin = localStorage.getItem('wf_security_pin');
        if (storedPin) {
            setIsLocked(true);
        }
    }, []);

    // 9. Auth & Data Fetching
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            const loadData = async () => {
                try {
                    const [
                        txs, accs, bgs, gls, lns, dbs, subs, invs, invsts, rules, autoRules, wdgs
                    ] = await Promise.all([
                        fetchData('transactions'),
                        fetchData('accounts'),
                        fetchData('budgets'),
                        fetchData('goals'),
                        fetchData('loans'),
                        fetchData('debts'),
                        fetchData('subscriptions'),
                        fetchData('invoices'),
                        fetchData('investments'),
                        fetchData('recurring_rules'),
                        fetchData('automation_rules'),
                        fetchData('widgets')
                    ]);

                    if (txs) setTransactions(txs);
                    if (accs) setAccountsState(accs);
                    if (bgs) setBudgets(bgs);
                    if (gls) setGoals(gls);
                    if (lns) setLoans(lns);
                    if (dbs) setDebts(dbs);
                    if (subs) setSubscriptions(subs);
                    if (invs) setInvoices(invs);
                    if (invsts) setInvestments(invsts);
                    if (rules) setRecurringRules(rules);
                    if (autoRules) setAutomationRules(autoRules);
                    if (wdgs && wdgs.length > 0) {
                        setWidgets(wdgs);
                    } else {
                        const initializedWidgets = DEFAULT_WIDGETS.map(w => ({ ...w, id: crypto.randomUUID() }));
                        await Promise.all(initializedWidgets.map(w => addData('widgets', w)));
                        setWidgets(initializedWidgets);
                    }
                } catch (error: any) {
                    console.error('Error loading data:', error);
                    addToast('Errore caricamento dati: ' + error.message, 'error');
                }
            };
            loadData();
        }
    }, [session]);

    // 10. Automation Engine
    useEffect(() => {
        if (!session || recurringRules.length === 0) return;

        const today = new Date();
        let newTransactions: Transaction[] = [];
        let updatedRules = [...recurringRules];
        let generatedCount = 0;

        updatedRules = updatedRules.map(rule => {
            if (!rule.active) return rule;

            let nextRun = new Date(rule.nextRunDate);
            let ruleChanged = false;

            while (nextRun <= today) {
                newTransactions.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    amount: rule.amount,
                    type: rule.type,
                    category: rule.category,
                    description: rule.description + " (Auto)",
                    date: nextRun.toISOString(),
                    accountId: rule.accountId,
                    isBusiness: rule.isBusiness
                });

                if (rule.frequency === 'monthly') {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                } else {
                    nextRun.setFullYear(nextRun.getFullYear() + 1);
                }
                ruleChanged = true;
                generatedCount++;
            }

            if (ruleChanged) {
                return { ...rule, nextRunDate: nextRun.toISOString() };
            }
            return rule;
        });

        if (newTransactions.length > 0) {
            setTransactions(prev => [...prev, ...newTransactions]);
            setRecurringRules(updatedRules);

            Promise.all([
                ...newTransactions.map(t => addData('transactions', t)),
                ...updatedRules.map(r => updateData('recurring_rules', r.id, r))
            ]);

            addToast(`${generatedCount} transazioni ricorrenti generate`, 'info');
        }
    }, [recurringRules, session, addData, updateData]);

    // 11. Notifications Monitoring
    useNotifications({
        invoices,
        subscriptions,
        loans,
        budgets,
        transactions
    });

    // --- CONDITIONAL RETURNS (Must be after all hooks) ---

    if (!supabase) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-500">Configurazione Mancante</h1>
                    <p>Le chiavi di Supabase non sono state trovate.</p>
                    <p className="text-sm text-slate-400">
                        Assicurati di aver aggiunto <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>
                        nelle variabili d'ambiente di Vercel (o nel file .env locale).
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Caricamento...</div>;
    }

    if (!session) {
        return <Auth />;
    }

    // --- HANDLERS ---

    // Widget Handlers
    const handleToggleWidget = async (id: string) => {
        const widget = widgets.find(w => w.id === id);
        if (!widget) return;
        const newVisible = !widget.visible;
        try {
            await updateData('widgets', id, { visible: newVisible });
            setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: newVisible } : w));
        } catch (error) {
            console.error(error);
            addToast("Errore aggiornamento widget", "error");
        }
    };

    const handleMoveWidget = async (index: number, direction: 'up' | 'down') => {
        const newWidgets = [...widgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newWidgets.length) {
            const temp = newWidgets[index];
            newWidgets[index] = newWidgets[targetIndex];
            newWidgets[targetIndex] = temp;
            newWidgets.forEach((w, i) => w.order = i + 1);

            setWidgets(newWidgets); // Optimistic update

            try {
                // Update all widgets order in DB
                await Promise.all(newWidgets.map(w => updateData('widgets', w.id, { order: w.order })));
            } catch (error) {
                console.error(error);
                addToast("Errore riordinamento widget", "error");
            }
        }
    };

    // Transaction Handlers
    const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>): Promise<string> => {
        const id = crypto.randomUUID();
        const transaction: Transaction = {
            ...newTx,
            id: id,
        };
        try {
            await addData('transactions', transaction);
            setTransactions(prev => [transaction, ...prev]);
            return id;
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio transazione", "error");
            return '';
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        try {
            await deleteData('transactions', id);
            setTransactions(prev => prev.filter(t => t.id !== id));
            setInvoices(prev => prev.map(inv => inv.linkedTransactionId === id ? { ...inv, status: 'sent', linkedTransactionId: undefined } : inv));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione transazione", "error");
        }
    };

    // Recurring Rules Handlers
    const handleAddRecurringRule = async (rule: Omit<RecurringTransaction, 'id'>) => {
        const newRule = { ...rule, id: crypto.randomUUID() };
        try {
            await addData('recurring_rules', newRule);
            setRecurringRules(prev => [...prev, newRule]);
            addToast("Regola ricorrente salvata!", "success");
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio regola", "error");
        }
    };

    const handleDeleteRecurringRule = async (id: string) => {
        try {
            await deleteData('recurring_rules', id);
            setRecurringRules(prev => prev.filter(r => r.id !== id));
            addToast("Regola eliminata.", "info");
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione regola", "error");
        }
    };

    // Automation Rule Handlers
    const handleAddAutomationRule = async (newRule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>) => {
        const rule: AutomationRule = {
            ...newRule,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            triggerCount: 0
        };
        try {
            await addData('automation_rules', rule);
            setAutomationRules(prev => [...prev, rule]);
            addToast("Automazione creata!", "success");
        } catch (error) {
            console.error(error);
            addToast("Errore creazione automazione", "error");
        }
    };

    const handleDeleteAutomationRule = async (id: string) => {
        try {
            await deleteData('automation_rules', id);
            setAutomationRules(prev => prev.filter(r => r.id !== id));
            addToast("Automazione eliminata.", "info");
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione automazione", "error");
        }
    };

    const handleToggleAutomationRule = async (id: string) => {
        const rule = automationRules.find(r => r.id === id);
        if (!rule) return;

        const updated = { ...rule, active: !rule.active };
        try {
            await updateData('automation_rules', id, updated);
            setAutomationRules(prev => prev.map(r => r.id === id ? updated : r));
            addToast(`Automazione ${updated.active ? 'attivata' : 'disattivata'}`, "info");
        } catch (error) {
            console.error(error);
            addToast("Errore aggiornamento automazione", "error");
        }
    };

    const handleUpdateAutomationRule = async (id: string, updates: Partial<AutomationRule>) => {
        const rule = automationRules.find(r => r.id === id);
        if (!rule) return;

        const updated = { ...rule, ...updates };
        try {
            await updateData('automation_rules', id, updated);
            setAutomationRules(prev => prev.map(r => r.id === id ? updated : r));
        } catch (error) {
            console.error(error);
        }
    };

    // Loan Handlers
    const handleAddLoan = async (newLoan: Omit<Loan, 'id'>) => {
        const loan: Loan = { ...newLoan, id: crypto.randomUUID() };
        try {
            await addData('loans', loan);
            setLoans(prev => [...prev, loan]);
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio finanziamento", "error");
        }
    };

    const handleDeleteLoan = async (id: string) => {
        try {
            await deleteData('loans', id);
            setLoans(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione finanziamento", "error");
        }
    };

    const handlePayInstallment = async (loan: Loan) => {
        const defaultAccount = accounts.find(a => a.type === 'bank') || accounts[0];
        if (!defaultAccount) { addToast("Crea un conto prima di pagare!", "error"); return; }

        const expense: Omit<Transaction, 'id'> = {
            amount: loan.monthlyPayment,
            type: 'expense',
            category: 'Finanziamenti',
            description: `Rata: ${loan.name}`,
            date: new Date().toISOString(),
            accountId: defaultAccount.id
        };
        await handleAddTransaction(expense);

        let nextDate = loan.nextPaymentDate;
        if (nextDate) {
            const d = new Date(nextDate);
            d.setMonth(d.getMonth() + 1);
            nextDate = d.toISOString();
        }

        const updatedLoan = {
            ...loan,
            remainingAmount: Math.max(0, loan.remainingAmount - loan.monthlyPayment),
            nextPaymentDate: nextDate
        };

        try {
            await updateData('loans', loan.id, updatedLoan);
            setLoans(prev => prev.map(l => l.id === loan.id ? updatedLoan : l));
            addToast("Rata pagata con successo!", "success");
        } catch (error) {
            console.error(error);
            addToast("Errore aggiornamento prestito", "error");
        }
    };

    // Debt Handlers
    const handleAddDebt = async (newDebt: Omit<Debt, 'id'>) => {
        const debt: Debt = { ...newDebt, id: crypto.randomUUID() };
        try {
            await addData('debts', debt);
            setDebts(prev => [...prev, debt]);
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio debito", "error");
        }
    };

    const handleDeleteDebt = async (id: string) => {
        try {
            await deleteData('debts', id);
            setDebts(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione debito", "error");
        }
    };

    const handlePayDebt = async (debt: Debt, accountId: string) => {
        const expense: Omit<Transaction, 'id'> = {
            amount: debt.amount,
            type: 'expense',
            category: 'Debiti',
            description: `Saldo Debito: ${debt.creditorName}`,
            date: new Date().toISOString(),
            accountId: accountId
        };
        await handleAddTransaction(expense);

        try {
            await updateData('debts', debt.id, { isPaid: true });
            setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, isPaid: true } : d));
            addToast(`Debito con ${debt.creditorName} saldato!`, "success");
        } catch (error) {
            console.error(error);
            addToast("Errore aggiornamento debito", "error");
        }
    };

    // Account Handlers
    const handleAddAccount = async (newAcc: Omit<Account, 'id'>) => {
        const account: Account = { ...newAcc, id: crypto.randomUUID(), balance: newAcc.initialBalance };
        try {
            await addData('accounts', account);
            setAccountsState(prev => [...prev, account]);
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio conto", "error");
        }
    };

    const handleDeleteAccount = async (id: string) => {
        try {
            await deleteData('accounts', id);
            setAccountsState(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione conto", "error");
        }
    };

    // Budget Handlers
    const handleUpdateBudget = async (newBudget: Budget) => {
        const exists = budgets.find(b => b.category === newBudget.category);
        try {
            if (exists) {
                const updated = { ...newBudget, id: exists.id };
                await updateData('budgets', exists.id, updated);
                setBudgets(prev => prev.map(b => b.category === newBudget.category ? updated : b));
            } else {
                const budget = { ...newBudget, id: crypto.randomUUID() };
                await addData('budgets', budget);
                setBudgets(prev => [...prev, budget]);
            }
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio budget", "error");
        }
    };

    const handleDeleteBudget = async (category: string) => {
        const budget = budgets.find(b => b.category === category);
        if (!budget) return;
        try {
            await deleteData('budgets', budget.id);
            setBudgets(prev => prev.filter(b => b.category !== category));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione budget", "error");
        }
    };

    // Goal Handlers
    const handleAddGoal = async (newGoal: Omit<Goal, 'id'>) => {
        const goal = { ...newGoal, id: crypto.randomUUID() };
        try {
            await addData('goals', goal);
            setGoals(prev => [...prev, goal]);
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio obiettivo", "error");
        }
    };

    const handleDeleteGoal = async (id: string) => {
        try {
            await deleteData('goals', id);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione obiettivo", "error");
        }
    };

    const handleUpdateGoalAmount = async (id: string, amount: number) => {
        try {
            await updateData('goals', id, { currentAmount: amount });
            setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: amount } : g));
        } catch (error) {
            console.error(error);
            addToast("Errore aggiornamento obiettivo", "error");
        }
    }

    // Subscription Handlers
    const handleAddSubscription = async (newSub: Omit<Subscription, 'id'>) => {
        const sub = { ...newSub, id: crypto.randomUUID() };
        try {
            await addData('subscriptions', sub);
            setSubscriptions(prev => [...prev, sub]);
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio abbonamento", "error");
        }
    };

    const handleDeleteSubscription = async (id: string) => {
        try {
            await deleteData('subscriptions', id);
            setSubscriptions(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione abbonamento", "error");
        }
    };

    const handleRenewSubscription = async (sub: Subscription) => {
        const defaultAccount = accounts.find(a => a.type === 'bank') || accounts[0];
        if (!defaultAccount) { addToast("Crea un conto prima di pagare!", "error"); return; }

        const expense: Omit<Transaction, 'id'> = {
            amount: sub.cost,
            type: 'expense',
            category: sub.category,
            description: `Rinnovo: ${sub.name}`,
            date: new Date().toISOString(),
            accountId: defaultAccount.id
        };
        await handleAddTransaction(expense);

        const nextDate = new Date(sub.nextPaymentDate);
        if (sub.frequency === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        try {
            await updateData('subscriptions', sub.id, { nextPaymentDate: nextDate.toISOString() });
            setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, nextPaymentDate: nextDate.toISOString() } : s));
            addToast("Abbonamento rinnovato!", "success");
        } catch (error) {
            console.error(error);
            addToast("Errore rinnovo abbonamento", "error");
        }
    };

    // Invoice Handlers
    const handleAddInvoice = async (newInv: Omit<Invoice, 'id'>) => {
        const invoice = { ...newInv, id: crypto.randomUUID() };
        try {
            await addData('invoices', invoice);
            setInvoices(prev => [invoice, ...prev]);
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio fattura", "error");
        }
    };

    const handleDeleteInvoice = async (id: string) => {
        try {
            await deleteData('invoices', id);
            setInvoices(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione fattura", "error");
        }
    };

    const handleMarkInvoiceAsPaid = async (invoice: Invoice, accountId: string, date: string) => {
        const txId = await handleAddTransaction({
            amount: invoice.amount,
            type: invoice.type === 'issued' ? 'income' : 'expense',
            category: invoice.category || (invoice.type === 'issued' ? 'Freelance' : 'Servizi Web'),
            description: `${invoice.type === 'issued' ? 'Incasso' : 'Pagamento'} Ft. ${invoice.number} - ${invoice.entityName}`,
            date: date,
            accountId: accountId,
            isBusiness: true
        });

        try {
            await updateData('invoices', invoice.id, { status: 'paid', linkedTransactionId: txId });
            setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: 'paid', linkedTransactionId: txId } : inv));
        } catch (error) {
            console.error(error);
            addToast("Errore aggiornamento fattura", "error");
        }
    };

    // Investment Handlers
    const handleAddInvestment = async (newInv: Omit<Investment, 'id'>) => {
        const inv = { ...newInv, id: crypto.randomUUID() };
        try {
            await addData('investments', inv);
            setInvestments(prev => [...prev, inv]);
        } catch (error) {
            console.error(error);
            addToast("Errore salvataggio investimento", "error");
        }
    };

    const handleDeleteInvestment = async (id: string) => {
        try {
            await deleteData('investments', id);
            setInvestments(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error(error);
            addToast("Errore eliminazione investimento", "error");
        }
    };

    const handleUpdateInvestmentPrice = async (id: string, newPrice: number) => {
        const now = new Date().toISOString();
        try {
            await updateData('investments', id, { currentPrice: newPrice, lastUpdated: now });
            setInvestments(prev => prev.map(i => i.id === id ? { ...i, currentPrice: newPrice, lastUpdated: now } : i));
        } catch (error) {
            console.error(error);
            addToast("Errore aggiornamento investimento", "error");
        }
    };

    // IMPORT HANDLER
    const handleImportData = (data: any) => {
        if (data.transactions) setTransactions(data.transactions);
        if (data.loans) setLoans(data.loans);
        if (data.debts) setDebts(data.debts);
        if (data.accounts) setAccountsState(data.accounts);
        if (data.budgets) setBudgets(data.budgets);
        if (data.goals) setGoals(data.goals);
        if (data.subscriptions) setSubscriptions(data.subscriptions);
        if (data.invoices) setInvoices(data.invoices);
        if (data.investments) setInvestments(data.investments);
        if (data.recurringRules) setRecurringRules(data.recurringRules);

        addToast("Importazione completata con successo!", "success");
        setActiveView(AppView.DASHBOARD);
    };

    const resetFilters = () => {
        setFilterCategory('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterMinAmount('');
        setFilterMaxAmount('');
        setFilterSearch('');
    };

    // Helper for Privacy Mode
    const maskAmount = (amount: number) => privacyMode ? '€ •••' : `€ ${amount.toFixed(2)}`;

    // Automations Engine (after all handlers are defined)
    useAutomations({
        rules: automationRules,
        transactions,
        accounts,
        onCreateInvoice: handleAddInvoice,
        onUpdateRule: handleUpdateAutomationRule
    });

    // RENDER WIDGETS
    const renderWidget = (widget: DashboardWidget) => {
        if (!widget.visible) return null;

        switch (widget.componentId) {
            case 'summary_cards':
                return (
                    <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SummaryCard title="Patrimonio Netto" amount={summary.netWorth} type="balance" infoText="Calcolato come: Liquidità + Investimenti - Debiti Totali" />
                        <SummaryCard title="Entrate (Mese)" amount={summary.totalIncome} type="income" />
                        <SummaryCard title="Spese (Mese)" amount={summary.totalExpense} type="expense" />
                    </div>
                );
            case 'expense_pie':
                return (
                    <div className="col-span-1 md:col-span-1 xl:col-span-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg h-80">
                        <h3 className="text-lg font-semibold text-white mb-4">{widget.label}</h3>
                        <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(value: number) => `€ ${value.toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'net_worth_pie':
                return (
                    <div className="col-span-1 md:col-span-1 xl:col-span-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg h-80">
                        <h3 className="text-lg font-semibold text-white mb-4">{widget.label}</h3>
                        <div className="h-60 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={assetLiabilityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {assetLiabilityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(value: number) => `€ ${value.toFixed(2)}`} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                                <p className="text-xs text-slate-400">Netto</p>
                                <p className={`text-lg font-bold ${summary.netWorth >= 0 ? 'text-white' : 'text-rose-400'}`}>{privacyMode ? '****' : (summary.netWorth >= 0 ? '+' : '') + (summary.netWorth > 1000 ? (summary.netWorth / 1000).toFixed(1) + 'k' : summary.netWorth.toFixed(0))}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'income_vs_expense':
                return (
                    <div className="col-span-1 md:col-span-1 xl:col-span-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg h-80">
                        <h3 className="text-lg font-semibold text-white mb-4">{widget.label}</h3>
                        <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(value: number) => `€ ${value.toFixed(2)}`} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                        {comparisonData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Entrate' ? '#10b981' : '#f43f5e'} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'yearly_trend':
                return (
                    <div className="col-span-1 md:col-span-3 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-6">{widget.label}</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(value) => `€${value}`} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(value: number) => `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Entrate" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Spese" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'quick_budgets':
                return (
                    <div className="col-span-1 md:col-span-1 xl:col-span-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">{widget.label}</h3>
                            <button onClick={() => setActiveView(AppView.TRANSACTIONS)} className="text-sm text-blue-400 hover:text-blue-300">Gestisci</button>
                        </div>
                        <BudgetsView budgets={budgets} transactions={transactions} onUpdateBudget={handleUpdateBudget} onDeleteBudget={handleDeleteBudget} />
                    </div>
                );
            case 'quick_goals':
                return (
                    <div className="col-span-1 md:col-span-1 xl:col-span-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">{widget.label}</h3>
                            <button onClick={() => setActiveView(AppView.DASHBOARD)} className="text-sm text-blue-400 hover:text-blue-300">Vedi tutti</button>
                        </div>
                        <GoalsView goals={goals} onAddGoal={handleAddGoal} onDeleteGoal={handleDeleteGoal} onUpdateAmount={handleUpdateGoalAmount} />
                    </div>
                );
            case 'recent_transactions':
                return (
                    <div className="col-span-1 md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">{widget.label}</h3>
                            <button onClick={() => setActiveView(AppView.TRANSACTIONS)} className="text-sm text-blue-400 hover:text-blue-300">Vedi tutte</button>
                        </div>
                        <div className="space-y-3">
                            {transactions.slice(0, 5).map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{tx.description || tx.category}</p>
                                            <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tx.type === 'income' ? '+' : '-'} {maskAmount(tx.amount)}
                                    </span>
                                </div>
                            ))}
                            {transactions.length === 0 && <p className="text-slate-500 text-sm text-center">Nessuna transazione recente.</p>}
                        </div>
                    </div>
                );
            case 'tax_deadline':
                return (
                    <div className="col-span-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 ${nextTaxDeadline.daysLeft < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <Clock className={`w-10 h-10 mb-3 ${nextTaxDeadline.daysLeft < 30 ? 'text-rose-400' : 'text-emerald-400'}`} />
                        <h3 className="text-white font-bold text-lg">Prossima Scadenza</h3>
                        <p className="text-slate-400 text-sm mb-2">{nextTaxDeadline.date.toLocaleDateString()}</p>
                        <div className="text-3xl font-bold text-white mb-1">{nextTaxDeadline.daysLeft}</div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Giorni Rimanenti</p>
                    </div>
                );
            case 'debt_summary':
                return (
                    <div className="col-span-1 bg-gradient-to-br from-rose-900/20 to-slate-800 border border-rose-500/20 rounded-2xl p-6 flex flex-col justify-center relative">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-bold">Debito Totale</h3>
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                        </div>
                        <p className="text-3xl font-bold text-rose-400 mb-1">{maskAmount(totalDebtSummary)}</p>
                        <p className="text-xs text-slate-400">Include Finanziamenti e Debiti Personali.</p>
                        <div className="mt-4 w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            {/* Dummy progress just for visual */}
                            <div className="h-full bg-rose-500 w-1/3 rounded-full opacity-50"></div>
                        </div>
                    </div>
                );
            case 'actions':
                return (
                    <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-6 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                            <div><h3 className="text-lg font-bold text-white mb-1">Nuova Spesa?</h3><p className="text-indigo-200 text-sm">Aggiungi transazione</p></div>
                            <button onClick={() => setIsModalOpen(true)} className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold p-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/20"><Plus className="w-5 h-5" /></button>
                        </div>
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setActiveView(AppView.ACCOUNTS)}>
                            <div><h3 className="text-lg font-bold text-white mb-1">Conti & Carte</h3><p className="text-slate-400 text-sm">Gestisci la tua liquidità</p></div>
                            <div className="bg-slate-700 text-white p-3 rounded-xl"><WalletCards className="w-5 h-5" /></div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderContent = () => {
        if (activeView === AppView.COACH) return <CoachView transactions={transactions} summary={summary} loans={loans} accounts={accounts} subscriptions={subscriptions} invoices={invoices} investments={investments} debts={debts} />;
        if (activeView === AppView.ACCOUNTS) return <AccountsView accounts={accounts} transactions={transactions} onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} />;
        if (activeView === AppView.LOANS) return <LoansView loans={loans} onAddLoan={handleAddLoan} onDeleteLoan={handleDeleteLoan} onPayInstallment={handlePayInstallment} />;
        if (activeView === AppView.DEBTS) return <DebtsView debts={debts} accounts={accounts} onAddDebt={handleAddDebt} onDeleteDebt={handleDeleteDebt} onPayDebt={handlePayDebt} />;
        if (activeView === AppView.SUBSCRIPTIONS) return <SubscriptionsView subscriptions={subscriptions} onAddSubscription={handleAddSubscription} onDeleteSubscription={handleDeleteSubscription} onRenewSubscription={handleRenewSubscription} />;
        if (activeView === AppView.TAXES) return <TaxesView transactions={transactions} invoices={invoices} accounts={accounts} onAddTransaction={handleAddTransaction} addToast={addToast} />;
        if (activeView === AppView.INVOICES) return <InvoicesView invoices={invoices} accounts={accounts} onAddInvoice={handleAddInvoice} onDeleteInvoice={handleDeleteInvoice} onMarkAsPaid={handleMarkInvoiceAsPaid} addToast={addToast} />;
        if (activeView === AppView.INVESTMENTS) return <InvestmentsView investments={investments} onAddInvestment={handleAddInvestment} onDeleteInvestment={handleDeleteInvestment} onUpdatePrice={handleUpdateInvestmentPrice} />;
        if (activeView === AppView.FORECAST) return <ForecastView transactions={transactions} subscriptions={subscriptions} loans={loans} accounts={accounts} />;
        if (activeView === AppView.CALENDAR) return <CalendarView loans={loans} subscriptions={subscriptions} invoices={invoices} />;
        if (activeView === AppView.SETTINGS) return <SettingsView onImport={handleImportData} addToast={addToast} />;
        if (activeView === AppView.RECURRING) return <RecurringView recurringRules={recurringRules} accounts={accounts} onAddRule={handleAddRecurringRule} onDeleteRule={handleDeleteRecurringRule} />;
        if (activeView === AppView.GAMIFICATION) {
            const badges = calculateBadges(summary, investments, debts, loans, budgets, transactions);
            return <GamificationView badges={badges} />;
        }
        if (activeView === AppView.AUTOMATIONS) {
            return <AutomationsView
                rules={automationRules}
                accounts={accounts}
                onAddRule={handleAddAutomationRule}
                onDeleteRule={handleDeleteAutomationRule}
                onToggleRule={handleToggleAutomationRule}
            />;
        }

        if (activeView === AppView.TRANSACTIONS) {
            return (
                <div className="space-y-6">
                    {/* Filters Toolbar (Same as before) */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <List className="w-6 h-6 text-blue-400" />
                                <h2 className="text-2xl font-bold text-white">Storico Transazioni</h2>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto flex-wrap">
                                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border flex-1 md:flex-none ${showFilters ? 'bg-slate-700 border-slate-600 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:text-white'}`}><Filter className="w-4 h-4" /> Filtri</button>
                                <button onClick={() => setIsSubscriptionModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20 flex-1 md:flex-none"><Repeat className="w-4 h-4" /> Check Abbonamenti</button>
                                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex-1 md:flex-none shadow-lg shadow-blue-900/20"><Plus className="w-4 h-4" /> Aggiungi</button>
                            </div>
                        </div>
                        {showFilters && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                                <div className="col-span-2 md:col-span-3 lg:col-span-5 mb-2"><div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" /><input type="text" placeholder="Cerca nella descrizione..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /></div></div>
                                <div className="flex flex-col gap-1"><label className="text-xs text-slate-500 font-medium">Dal</label><input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /></div>
                                <div className="flex flex-col gap-1"><label className="text-xs text-slate-500 font-medium">Al</label><input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /></div>
                                <div className="flex flex-col gap-1 col-span-2 md:col-span-1"><label className="text-xs text-slate-500 font-medium">Categoria</label><select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"><option value="">Tutte</option><optgroup label="Entrate">{INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup><optgroup label="Spese">{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup></select></div>
                                <div className="flex flex-col gap-1"><label className="text-xs text-slate-500 font-medium">Min</label><input type="number" placeholder="0.00" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /></div>
                                <div className="flex flex-col gap-1"><label className="text-xs text-slate-500 font-medium">Max</label><div className="flex gap-2"><input type="number" placeholder="Max" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" /><button onClick={resetFilters} className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 border border-slate-700 rounded-lg transition-colors"><RotateCcw className="w-5 h-5" /></button></div></div>
                            </div>
                        )}
                    </div>

                    {/* Transaction Chart */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 h-72">
                        <div className="flex items-center gap-2 mb-4"><BarChartIcon className="w-5 h-5 text-slate-400" /><h3 className="text-sm font-bold text-slate-300 uppercase">Andamento {filterStartDate && filterEndDate ? 'Periodo Selezionato' : 'Recente'}</h3></div>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={transactionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                                <Bar dataKey="income" name="Entrate" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expense" name="Spese" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-slate-300">
                                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Conto</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4">Descrizione</th>
                                        <th className="px-6 py-4">Importo</th>
                                        <th className="px-6 py-4 text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {filteredTransactions.map(tx => {
                                        const accName = accounts.find(a => a.id === tx.accountId)?.name || 'Conto eliminato';
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-slate-400">{accName}</td>
                                                <td className="px-6 py-4 text-sm"><div className="flex flex-col gap-1"><span className={`px-2 py-1 rounded-md text-xs font-medium w-fit ${tx.type === 'income' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>{tx.category}</span>{tx.isBusiness && <span className="text-[10px] text-blue-400 font-bold">BUSINESS</span>}</div></td>
                                                <td className="px-6 py-4 text-sm">{tx.description || '-'}</td>
                                                <td className={`px-6 py-4 font-medium ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{tx.type === 'income' ? '+' : '-'} {maskAmount(tx.amount).replace('€ ', '€ ')}</td>
                                                <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-500 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        // Dashboard View (Dynamic)
        return (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button onClick={() => setIsCustomizerOpen(true)} className="text-sm flex items-center gap-2 text-blue-400 hover:text-white transition-colors">
                        <Layout className="w-4 h-4" /> Personalizza Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {widgets
                        .filter(w => w.visible)
                        .sort((a, b) => a.order - b.order)
                        .map(widget => (
                            <React.Fragment key={widget.id}>
                                {renderWidget(widget)}
                            </React.Fragment>
                        ))
                    }
                </div>

                <DashboardCustomizer
                    isOpen={isCustomizerOpen}
                    onClose={() => setIsCustomizerOpen(false)}
                    widgets={widgets}
                    onToggleVisibility={handleToggleWidget}
                    onMoveUp={(idx) => handleMoveWidget(idx, 'up')}
                    onMoveDown={(idx) => handleMoveWidget(idx, 'down')}
                />
            </div>
        );
    };

    if (isLocked) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl text-center w-full max-w-xs">
                    <div className="bg-violet-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">App Bloccata</h2>
                    <p className="text-slate-400 text-sm mb-6">Inserisci il PIN per accedere a WealthFlow</p>

                    <div className="flex justify-center mb-6">
                        <input
                            type="password"
                            maxLength={4}
                            autoFocus
                            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[1em] w-48 focus:border-violet-500 outline-none"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handlePinUnlock}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Sblocca
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden">
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={removeToast}
                    />
                ))}
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl z-50 transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">W</span></div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">WealthFlow</h1>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto h-[calc(100vh-88px)]">
                    <button onClick={() => handleNavClick(AppView.DASHBOARD)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.DASHBOARD ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard className="w-5 h-5" /><span className="font-medium">Dashboard</span></button>
                    <button onClick={() => handleNavClick(AppView.FORECAST)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.FORECAST ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LineChart className="w-5 h-5" /><span className="font-medium">Forecast</span></button>
                    <button onClick={() => handleNavClick(AppView.CALENDAR)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.CALENDAR ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><CalendarDays className="w-5 h-5" /><span className="font-medium">Calendario</span></button>
                    <div className="pt-4 pb-2"><p className="text-xs font-bold text-slate-500 uppercase px-4">Gestione</p></div>
                    <button onClick={() => handleNavClick(AppView.TRANSACTIONS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.TRANSACTIONS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><List className="w-5 h-5" /><span className="font-medium">Transazioni</span></button>
                    <button onClick={() => handleNavClick(AppView.ACCOUNTS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.ACCOUNTS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><WalletCards className="w-5 h-5" /><span className="font-medium">Conti & Carte</span></button>
                    <button onClick={() => handleNavClick(AppView.LOANS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.LOANS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Landmark className="w-5 h-5" /><span className="font-medium">Finanziamenti</span></button>
                    <button onClick={() => handleNavClick(AppView.DEBTS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.DEBTS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><HandCoins className="w-5 h-5" /><span className="font-medium">Debiti</span></button>
                    <button onClick={() => handleNavClick(AppView.SUBSCRIPTIONS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.SUBSCRIPTIONS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Repeat className="w-5 h-5" /><span className="font-medium">Abbonamenti</span></button>
                    <button onClick={() => handleNavClick(AppView.INVESTMENTS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.INVESTMENTS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><TrendingUp className="w-5 h-5" /><span className="font-medium">Investimenti</span></button>
                    <button onClick={() => handleNavClick(AppView.GAMIFICATION)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.GAMIFICATION ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Trophy className="w-5 h-5" /><span className="font-medium">Obiettivi & Badge</span></button>
                    <div className="pt-4 pb-2"><p className="text-xs font-bold text-slate-500 uppercase px-4">Business</p></div>
                    <button onClick={() => handleNavClick(AppView.TAXES)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.TAXES ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Briefcase className="w-5 h-5" /><span className="font-medium">Partita IVA</span></button>
                    <button onClick={() => handleNavClick(AppView.INVOICES)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.INVOICES ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Receipt className="w-5 h-5" /><span className="font-medium">Fatture</span></button>
                    <div className="pt-4 pb-2"><p className="text-xs font-bold text-slate-500 uppercase px-4">Altro</p></div>
                    <button onClick={() => handleNavClick(AppView.RECURRING)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.RECURRING ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Zap className="w-5 h-5" /><span className="font-medium">Automazioni</span></button>
                    <button onClick={() => handleNavClick(AppView.GAMIFICATION)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.GAMIFICATION ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Trophy className="w-5 h-5" /><span className="font-medium">Obiettivi & Badge</span></button>
                    <button onClick={() => handleNavClick(AppView.AUTOMATIONS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.AUTOMATIONS ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Zap className="w-5 h-5" /><span className="font-medium">Automazioni Avanzate</span></button>
                    <button onClick={() => handleNavClick(AppView.COACH)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.COACH ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Bot className="w-5 h-5" /><span className="font-medium">AI Coach</span></button>
                    <button onClick={() => handleNavClick(AppView.SETTINGS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === AppView.SETTINGS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Settings className="w-5 h-5" /><span className="font-medium">Impostazioni</span></button>
                </nav>
            </aside>

            <div className="md:ml-64 flex-1 flex flex-col min-h-screen z-10 relative">
                {/* Mobile Header */}
                <div className="md:hidden bg-slate-900/80 backdrop-blur-xl p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="mr-1 text-slate-400 hover:text-white">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-lg">W</span></div>
                        <span className="font-bold text-white">WealthFlow</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setActiveView(AppView.DASHBOARD)} className="text-slate-400"><LayoutDashboard /></button>
                        <button onClick={() => setActiveView(AppView.TRANSACTIONS)} className="text-slate-400"><List /></button>
                        <button onClick={() => setActiveView(AppView.COACH)} className="text-violet-400"><Bot /></button>
                    </div>
                </div>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white capitalize">{activeView.replace('_', ' ').toLowerCase()}</h2>
                        {privacyMode ?
                            <button onClick={() => setPrivacyMode(false)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Mostra importi"><EyeOff className="w-5 h-5" /></button> :
                            <button onClick={() => setPrivacyMode(true)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Nascondi importi"><Eye className="w-5 h-5" /></button>
                        }
                    </div>

                    {renderContent()}
                </main>
            </div>

            {/* Bottom Navigation for Mobile */}
            <BottomNavigation activeView={activeView} onNavigate={handleNavClick} />

            {/* Modals */}
            {isModalOpen && (
                <AddTransactionModal
                    onClose={() => setIsModalOpen(false)}
                    onAddTransaction={handleAddTransaction}
                    accounts={accounts}
                />
            )}
            {isSubscriptionModalOpen && (
                <SubscriptionModal
                    onClose={() => setIsSubscriptionModalOpen(false)}
                    onAddSubscription={handleAddSubscription}
                />
            )}
            {isCustomizerOpen && (
                <DashboardCustomizer
                    widgets={widgets}
                    onClose={() => setIsCustomizerOpen(false)}
                    onSave={handleSaveWidgets}
                />
            )}
        </div>
    );
}

export default App;