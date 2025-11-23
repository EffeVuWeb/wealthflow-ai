import { useEffect } from 'react';
import { Invoice, Subscription, Loan, Budget, Transaction } from '../types';
import { getNotificationConfig, sendNotification } from '../services/notificationService';

interface UseNotificationsProps {
    invoices: Invoice[];
    subscriptions: Subscription[];
    loans: Loan[];
    budgets: Budget[];
    transactions: Transaction[];
}

export const useNotifications = ({ invoices, subscriptions, loans, budgets, transactions }: UseNotificationsProps) => {
    useEffect(() => {
        const config = getNotificationConfig();

        if (!config.enabled) {
            return;
        }

        const checkNotifications = () => {
            const now = new Date();
            const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Check invoice deadlines (3 days)
            if (config.invoiceDeadlines) {
                invoices
                    .filter(inv => inv.status !== 'paid')
                    .forEach(invoice => {
                        const dueDate = new Date(invoice.dueDate);
                        if (dueDate <= threeDaysFromNow && dueDate > now) {
                            const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            sendNotification('📄 Scadenza Fattura', {
                                body: `Fattura ${invoice.number} scade tra ${daysLeft} giorni (€${invoice.amount})`,
                                tag: `invoice-${invoice.id}`
                            });
                        }
                    });
            }

            // Check subscription renewals (1 day)
            if (config.subscriptionRenewals) {
                subscriptions
                    .filter(sub => sub.active)
                    .forEach(sub => {
                        const renewalDate = new Date(sub.nextPaymentDate);
                        if (renewalDate <= oneDayFromNow && renewalDate > now) {
                            sendNotification('🔄 Rinnovo Abbonamento', {
                                body: `${sub.name} si rinnova domani (€${sub.cost})`,
                                tag: `subscription-${sub.id}`
                            });
                        }
                    });
            }

            // Check loan payments (3 days)
            if (config.loanPayments) {
                loans.forEach(loan => {
                    if (loan.nextPaymentDate) {
                        const paymentDate = new Date(loan.nextPaymentDate);
                        if (paymentDate <= threeDaysFromNow && paymentDate > now) {
                            const daysLeft = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            sendNotification('🏦 Rata Prestito', {
                                body: `${loan.name}: rata di €${loan.monthlyPayment} tra ${daysLeft} giorni`,
                                tag: `loan-${loan.id}`
                            });
                        }
                    }
                });
            }

            // Check budget exceeded
            if (config.budgetAlerts) {
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                budgets.forEach(budget => {
                    const spent = transactions
                        .filter(t => {
                            const txDate = new Date(t.date);
                            return t.type === 'expense' &&
                                t.category === budget.category &&
                                txDate.getMonth() === currentMonth &&
                                txDate.getFullYear() === currentYear;
                        })
                        .reduce((sum, t) => sum + t.amount, 0);

                    if (spent > budget.limit) {
                        const excess = spent - budget.limit;
                        sendNotification('💰 Budget Superato', {
                            body: `Hai superato il budget "${budget.category}" di €${excess.toFixed(0)}`,
                            tag: `budget-${budget.category}`
                        });
                    }
                });
            }
        };

        // Check immediately
        checkNotifications();

        // Check every hour
        const interval = setInterval(checkNotifications, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [invoices, subscriptions, loans, budgets, transactions]);
};
