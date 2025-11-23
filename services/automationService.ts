import { AutomationRule, Transaction, Account, Invoice } from '../types';
import { sendNotification } from './notificationService';

export const evaluateTrigger = (
    rule: AutomationRule,
    transaction: Transaction,
    accounts: Account[],
    transactions: Transaction[]
): boolean => {
    const { trigger } = rule;

    switch (trigger.type) {
        case 'transaction_received': {
            // Check if transaction matches conditions
            if (trigger.conditions.accountId && transaction.accountId !== trigger.conditions.accountId) {
                return false;
            }
            if (trigger.conditions.category && transaction.category !== trigger.conditions.category) {
                return false;
            }
            if (trigger.conditions.amountMin && transaction.amount < trigger.conditions.amountMin) {
                return false;
            }
            if (trigger.conditions.amountMax && transaction.amount > trigger.conditions.amountMax) {
                return false;
            }
            if (trigger.conditions.descriptionContains) {
                const desc = transaction.description.toLowerCase();
                const search = trigger.conditions.descriptionContains.toLowerCase();
                if (!desc.includes(search)) {
                    return false;
                }
            }
            return true;
        }

        case 'balance_below': {
            if (!trigger.conditions.balanceThreshold) return false;
            const account = accounts.find(a => a.id === trigger.conditions.accountId);
            if (!account) return false;
            return account.balance < trigger.conditions.balanceThreshold;
        }

        case 'category_exceeds': {
            if (!trigger.conditions.category || !trigger.conditions.categoryLimit) return false;
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const spent = transactions
                .filter(t => {
                    const txDate = new Date(t.date);
                    return t.type === 'expense' &&
                        t.category === trigger.conditions.category &&
                        txDate.getMonth() === currentMonth &&
                        txDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            return spent > trigger.conditions.categoryLimit;
        }

        default:
            return false;
    }
};

export const executeAction = (
    rule: AutomationRule,
    transaction: Transaction,
    onCreateInvoice?: (invoice: Partial<Invoice>) => void,
    onAddTag?: (transactionId: string, tag: string) => void
): void => {
    const { action } = rule;

    switch (action.type) {
        case 'create_invoice': {
            if (onCreateInvoice && action.params.invoiceAmount) {
                const invoice: Partial<Invoice> = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    number: `AUTO-${Date.now()}`,
                    type: 'issued',
                    amount: action.params.invoiceAmount,
                    entityName: action.params.invoiceDescription || transaction.description,
                    date: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                    status: 'sent'
                };
                onCreateInvoice(invoice);
            }
            break;
        }

        case 'send_notification': {
            const title = action.params.notificationTitle || 'Automazione Attivata';
            const body = action.params.notificationBody || `Regola "${rule.name}" eseguita per ${transaction.description}`;
            sendNotification(title, { body });
            break;
        }

        case 'add_tag': {
            if (onAddTag && action.params.tag) {
                onAddTag(transaction.id, action.params.tag);
            }
            break;
        }
    }
};
