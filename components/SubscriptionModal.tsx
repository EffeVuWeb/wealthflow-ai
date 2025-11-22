import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { X, Repeat, AlertCircle, TrendingDown } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

interface SubscriptionGroup {
  id: string;
  description: string;
  amount: number;
  count: number;
  category: string;
  lastDate: string;
  totalSpent: number;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, transactions }) => {
  const potentialSubscriptions = useMemo(() => {
    if (!isOpen) return [];

    // Filter for expenses only
    const expenses = transactions.filter(t => t.type === 'expense');
    const groups: Record<string, SubscriptionGroup> = {};

    expenses.forEach(t => {
      // Normalize description to find matches (case insensitive, trimmed)
      const normDesc = t.description.toLowerCase().trim();
      // Key combines description and amount to find exact recurring charges
      const key = `${normDesc}-${t.amount}`;

      if (!groups[key]) {
        groups[key] = {
          id: key,
          description: t.description, // Keep original description of first occurrence
          amount: t.amount,
          count: 0,
          category: t.category,
          lastDate: t.date,
          totalSpent: 0
        };
      }

      groups[key].count += 1;
      groups[key].totalSpent += t.amount;
      // Update last date if this transaction is more recent
      if (new Date(t.date) > new Date(groups[key].lastDate)) {
        groups[key].lastDate = t.date;
      }
    });

    // Filter for items that appear at least twice
    return Object.values(groups)
      .filter(g => g.count > 1)
      .sort((a, b) => b.amount - a.amount); // Sort by amount high to low
  }, [isOpen, transactions]);

  const totalMonthlyPotential = potentialSubscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-500/20 rounded-full">
                <Repeat className="w-6 h-6 text-violet-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Analisi Abbonamenti</h2>
                <p className="text-sm text-slate-400">Rilevati in base alla frequenza e all'importo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 flex-shrink-0 flex justify-between items-center">
            <div>
                <p className="text-slate-400 text-sm">Costo Mensile Stimato</p>
                <p className="text-2xl font-bold text-white">€ {totalMonthlyPotential.toLocaleString('it-IT', {minimumFractionDigits: 2})}</p>
            </div>
            <div className="text-right">
                <p className="text-slate-400 text-sm">Costo Annuale Proiettato</p>
                <p className="text-xl font-bold text-rose-400">€ {(totalMonthlyPotential * 12).toLocaleString('it-IT', {minimumFractionDigits: 2})}</p>
            </div>
        </div>

        <div className="overflow-y-auto pr-2 space-y-3 flex-1">
            {potentialSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Non abbiamo rilevato spese ricorrenti sospette.</p>
                </div>
            ) : (
                potentialSubscriptions.map(sub => (
                    <div key={sub.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center hover:border-violet-500/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                {sub.description.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">{sub.description}</h4>
                                <p className="text-xs text-slate-400 flex gap-2">
                                    <span className="bg-slate-700 px-2 py-0.5 rounded">{sub.category}</span>
                                    <span>Rilevato {sub.count} volte</span>
                                    <span>Ultimo: {new Date(sub.lastDate).toLocaleDateString()}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-white text-lg">€ {sub.amount.toFixed(2)}</p>
                            <p className="text-xs text-slate-500">per pagamento</p>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700 flex-shrink-0">
            <p className="text-xs text-slate-500 text-center">
                Questa lista è generata automaticamente analizzando le descrizioni e gli importi identici. 
                Verifica sempre prima di cancellare un servizio.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;