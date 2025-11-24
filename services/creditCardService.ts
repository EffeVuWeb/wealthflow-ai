import { Account, Transaction } from '../types';

/**
 * Calculate credit card balance due based on previous month's expenses
 */
export const calculateCardBalance = (
    card: Account,
    transactions: Transaction[]
): number => {
    if (card.type !== 'credit_card') return 0;

    // Get previous month's date range
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Sum all expenses charged to this card in previous month
    const balance = transactions
        .filter(t =>
            t.accountId === card.id &&
            t.type === 'expense' &&
            new Date(t.date) >= lastMonth &&
            new Date(t.date) <= lastMonthEnd
        )
        .reduce((sum, t) => sum + t.amount, 0);

    return balance;
};

/**
 * Get next payment date for credit card
 */
export const getNextPaymentDate = (paymentDay: number = 15): Date => {
    const today = new Date();
    const nextPayment = new Date(today.getFullYear(), today.getMonth(), paymentDay);

    // If payment day already passed this month, use next month
    if (nextPayment < today) {
        nextPayment.setMonth(nextPayment.getMonth() + 1);
    }

    return nextPayment;
};

/**
 * Get days until next payment
 */
export const getDaysUntilPayment = (paymentDay: number = 15): number => {
    const today = new Date();
    const nextPayment = getNextPaymentDate(paymentDay);
    return Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
