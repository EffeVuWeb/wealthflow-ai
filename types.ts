export type TransactionType = 'income' | 'expense';
export type AccountType = 'bank' | 'cash' | 'credit_card';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number; // Starting balance
  balance: number; // Current calculated balance
  color?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  accountId: string; // Link to the account used
  isBusiness?: boolean; // New: Flags if transaction is related to Partita IVA
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  accountId: string;
  frequency: 'monthly' | 'yearly';
  startDate: string;
  nextRunDate: string;
  active: boolean;
  isBusiness?: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  entityName: string; // Client or Supplier
  amount: number;
  type: 'issued' | 'received'; // Emessa (Active) or Ricevuta (Passive)
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  linkedTransactionId?: string; // ID of the transaction when paid
  category?: string; // For consistency with expenses
}

export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate?: number;
  nextPaymentDate?: string; // ISO Date string
  reminderEnabled?: boolean;
}

export interface Debt {
  id: string;
  creditorName: string; // Who do I owe?
  amount: number;
  dueDate?: string;
  description?: string;
  isPaid: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  frequency: 'monthly' | 'yearly';
  nextPaymentDate: string;
  category: string;
  active: boolean;
  logo?: string; // Optional placeholder for future
}

export interface Investment {
  id: string;
  name: string;
  symbol: string; // e.g. BTC, AAPL
  category: 'Stocks' | 'Crypto' | 'ETF' | 'Real Estate' | 'Commodities' | 'Other';
  quantity: number;
  averageBuyPrice: number; // PMC
  currentPrice: number;
  lastUpdated: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  netWorth: number; // Assets (Cash + Investments) - Liabilities
  investmentsValue: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isTyping?: boolean;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  LOANS = 'LOANS',
  DEBTS = 'DEBTS', // New separate view
  ACCOUNTS = 'ACCOUNTS',
  INVESTMENTS = 'INVESTMENTS',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  RECURRING = 'RECURRING', // New Automation View
  TAXES = 'TAXES',
  INVOICES = 'INVOICES',
  COACH = 'COACH',
  FORECAST = 'FORECAST',
  CALENDAR = 'CALENDAR',
  GAMIFICATION = 'GAMIFICATION',
  AUTOMATIONS = 'AUTOMATIONS',
  SETTINGS = 'SETTINGS'
}

export interface Budget {
  category: string;
  limit: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  lastCelebrated?: number; // Last milestone percentage celebrated (0, 25, 50, 75, 100)
  createdAt?: string; // For calculating savings rate
}

export interface DashboardWidget {
  id: string;
  label: string;
  componentId: 'summary_cards' | 'expense_pie' | 'net_worth_pie' | 'income_vs_expense' | 'yearly_trend' | 'quick_budgets' | 'quick_goals' | 'actions' | 'recent_transactions' | 'tax_deadline' | 'debt_summary';
  colSpan: '1' | '2' | '3' | 'full';
  visible: boolean;
  order: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  unlocked: boolean;
  progress?: number; // 0 to 100
  color: string;
}

export type AutomationTriggerType = 'transaction_received' | 'balance_below' | 'category_exceeds';
export type AutomationActionType = 'create_invoice' | 'send_notification' | 'add_tag';

export interface AutomationTrigger {
  type: AutomationTriggerType;
  conditions: {
    accountId?: string;
    category?: string;
    amountMin?: number;
    amountMax?: number;
    descriptionContains?: string;
    balanceThreshold?: number;
    categoryLimit?: number;
  };
}

export interface AutomationAction {
  type: AutomationActionType;
  params: {
    invoiceAmount?: number;
    invoiceDescription?: string;
    notificationTitle?: string;
    notificationBody?: string;
    tag?: string;
  };
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}