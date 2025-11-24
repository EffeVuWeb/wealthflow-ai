import { Transaction, Budget, Subscription, Account } from '../types';

export interface SmartAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    action?: {
        label: string;
        callback: () => void;
    };
    dismissible: boolean;
    createdAt: string;
}

/**
 * Predict when a budget will be exhausted based on spending velocity
 */
export const predictBudgetDepletion = (
    budget: Budget,
    transactions: Transaction[]
): SmartAlert | null => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get transactions for this month in this category
    const categoryTransactions = transactions.filter(t =>
        t.type === 'expense' &&
        t.category === budget.category &&
        new Date(t.date) >= monthStart
    );

    const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget.limit - spent;

    if (remaining <= 0) {
        return {
            id: `budget-depleted-${budget.category}`,
            type: 'critical',
            title: '🚨 Budget Esaurito!',
            message: `Hai già speso tutto il budget per "${budget.category}" (€${budget.limit})`,
            dismissible: true,
            createdAt: new Date().toISOString()
        };
    }

    // Calculate daily spending rate
    const daysInMonth = now.getDate();
    const dailyRate = spent / daysInMonth;

    if (dailyRate === 0) return null;

    const daysUntilDepletion = Math.floor(remaining / dailyRate);

    // Alert if budget will be exhausted in less than 7 days
    if (daysUntilDepletion > 0 && daysUntilDepletion <= 7) {
        return {
            id: `budget-warning-${budget.category}`,
            type: 'warning',
            title: '⚠️ Budget in Esaurimento',
            message: `Il budget "${budget.category}" finirà tra ${daysUntilDepletion} giorni al ritmo attuale (€${dailyRate.toFixed(2)}/giorno)`,
            dismissible: true,
            createdAt: new Date().toISOString()
        };
    }

    return null;
};

/**
 * Predict when balance will drop below a threshold
 */
export const predictBalanceThreshold = (
    currentBalance: number,
    transactions: Transaction[],
    threshold: number = 500
): SmartAlert | null => {
    if (currentBalance <= threshold) {
        return {
            id: 'balance-critical',
            type: 'critical',
            title: '🚨 Saldo Basso!',
            message: `Il tuo saldo (€${currentBalance.toFixed(2)}) è sotto la soglia di sicurezza (€${threshold})`,
            dismissible: true,
            createdAt: new Date().toISOString()
        };
    }

    // Calculate average daily spending over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentExpenses = transactions.filter(t =>
        t.type === 'expense' &&
        new Date(t.date) >= sevenDaysAgo
    );

    const totalSpent = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const dailySpending = totalSpent / 7;

    if (dailySpending === 0) return null;

    const daysUntilThreshold = Math.floor((currentBalance - threshold) / dailySpending);

    // Alert if balance will drop below threshold in 3-5 days
    if (daysUntilThreshold > 0 && daysUntilThreshold <= 5) {
        return {
            id: 'balance-warning',
            type: 'warning',
            title: '⚠️ Attenzione al Saldo',
            message: `Al ritmo attuale (€${dailySpending.toFixed(2)}/giorno), il saldo scenderà sotto €${threshold} tra ${daysUntilThreshold} giorni`,
            dismissible: true,
            createdAt: new Date().toISOString()
        };
    }

    return null;
};

/**
 * Detect missing recurring transactions (e.g., forgotten subscriptions)
 */
export const detectMissingTransactions = (
    subscriptions: Subscription[],
    transactions: Transaction[]
): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const now = new Date();

    subscriptions.filter(s => s.active).forEach(sub => {
        const nextPayment = new Date(sub.nextPaymentDate);

        // Check if payment date has passed
        if (nextPayment < now) {
            const daysPast = Math.floor((now.getTime() - nextPayment.getTime()) / (1000 * 60 * 60 * 24));

            // Check if there's a transaction for this subscription
            const hasTransaction = transactions.some(t =>
                t.description.toLowerCase().includes(sub.name.toLowerCase()) &&
                Math.abs(t.amount - sub.cost) < 1 && // Allow €1 difference
                new Date(t.date) >= nextPayment
            );

            if (!hasTransaction && daysPast <= 7) {
                alerts.push({
                    id: `missing-sub-${sub.id}`,
                    type: 'info',
                    title: '💡 Abbonamento Non Registrato?',
                    message: `Non hai registrato il pagamento di "${sub.name}" (€${sub.cost}) previsto per il ${nextPayment.toLocaleDateString()}`,
                    dismissible: true,
                    createdAt: new Date().toISOString()
                });
            }
        }
    });

    return alerts;
};

/**
 * Detect upcoming credit card payments
 */
export const detectUpcomingCardPayments = (
    accounts: Account[],
    transactions: Transaction[]
): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const today = new Date();

    accounts
        .filter(a => a.type === 'credit_card' && a.paymentDay)
        .forEach(card => {
            const paymentDay = card.paymentDay || 15;
            const nextPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay);

            // If payment day already passed this month, use next month
            if (nextPayment < today) {
                nextPayment.setMonth(nextPayment.getMonth() + 1);
            }

            const daysUntil = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Calculate balance due (previous month's expenses)
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

            const balanceDue = transactions
                .filter(t =>
                    t.accountId === card.id &&
                    t.type === 'expense' &&
                    new Date(t.date) >= lastMonth &&
                    new Date(t.date) <= lastMonthEnd
                )
                .reduce((sum, t) => sum + t.amount, 0);

            // Alert 3-5 days before payment
            if (daysUntil > 0 && daysUntil <= 5 && balanceDue > 0) {
                alerts.push({
                    id: `card-payment-${card.id}`,
                    type: daysUntil <= 2 ? 'critical' : 'warning',
                    title: daysUntil === 1 ? '🚨 Carta da Pagare Domani!' : `⚠️ Carta da Pagare tra ${daysUntil} Giorni`,
                    message: `Devi pagare €${balanceDue.toFixed(2)} per "${card.name}" il ${nextPayment.toLocaleDateString('it-IT')}`,
                    dismissible: true,
                    createdAt: new Date().toISOString()
                });
            }
        });

    return alerts;
};

/**
 * Generate all smart alerts
 */
export const generateSmartAlerts = (
    budgets: Budget[],
    transactions: Transaction[],
    subscriptions: Subscription[],
    currentBalance: number,
    accounts: Account[] = []
): SmartAlert[] => {
    const alerts: SmartAlert[] = [];

    // Budget depletion alerts
    budgets.forEach(budget => {
        const alert = predictBudgetDepletion(budget, transactions);
        if (alert) alerts.push(alert);
    });

    // Balance threshold alert
    const balanceAlert = predictBalanceThreshold(currentBalance, transactions);
    if (balanceAlert) alerts.push(balanceAlert);

    // Missing transaction alerts
    const missingAlerts = detectMissingTransactions(subscriptions, transactions);
    alerts.push(...missingAlerts);

    // Credit card payment alerts
    const cardAlerts = detectUpcomingCardPayments(accounts, transactions);
    alerts.push(...cardAlerts);

    // Sort by priority: critical > warning > info
    const priorityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

    return alerts;
};
