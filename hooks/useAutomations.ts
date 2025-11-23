import { useEffect } from 'react';
import { AutomationRule, Transaction, Account, Invoice } from '../types';
import { evaluateTrigger, executeAction } from '../services/automationService';

interface UseAutomationsProps {
    rules: AutomationRule[];
    transactions: Transaction[];
    accounts: Account[];
    onCreateInvoice?: (invoice: Partial<Invoice>) => void;
    onAddTag?: (transactionId: string, tag: string) => void;
    onUpdateRule?: (ruleId: string, updates: Partial<AutomationRule>) => void;
}

export const useAutomations = ({
    rules,
    transactions,
    accounts,
    onCreateInvoice,
    onAddTag,
    onUpdateRule
}: UseAutomationsProps) => {
    useEffect(() => {
        const activeRules = rules.filter(r => r.active);
        if (activeRules.length === 0 || transactions.length === 0) return;

        // Check the most recent transaction against all active rules
        const latestTransaction = transactions[transactions.length - 1];
        if (!latestTransaction) return;

        activeRules.forEach(rule => {
            const triggered = evaluateTrigger(rule, latestTransaction, accounts, transactions);

            if (triggered) {
                executeAction(rule, latestTransaction, onCreateInvoice, onAddTag);

                // Update rule stats
                if (onUpdateRule) {
                    onUpdateRule(rule.id, {
                        lastTriggered: new Date().toISOString(),
                        triggerCount: rule.triggerCount + 1
                    });
                }
            }
        });
    }, [transactions, rules, accounts, onCreateInvoice, onAddTag, onUpdateRule]);
};
