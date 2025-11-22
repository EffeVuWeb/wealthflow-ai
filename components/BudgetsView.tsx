import React, { useState } from 'react';
import { Budget, Transaction } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { Calculator, Plus, Trash2, AlertCircle, TrendingDown } from './Icons';

interface BudgetsViewProps {
  budgets: Budget[];
  transactions: Transaction[];
  onUpdateBudget: (budget: Budget) => void;
  onDeleteBudget: (category: string) => void;
}

const BudgetsView: React.FC<BudgetsViewProps> = ({ budgets, transactions, onUpdateBudget, onDeleteBudget }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  // Helper to calculate spent amount for current month in a category
  const getSpentAmount = (category: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          t.category === category &&
          t.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`) // Simple YYYY-MM check
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory && newLimit) {
      onUpdateBudget({ category: newCategory, limit: parseFloat(newLimit) });
      setNewCategory('');
      setNewLimit('');
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-400" />
            Budget Mensili
        </h3>
        <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Imposta Budget
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-2">
            <div className="w-full md:w-auto flex-1">
                <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                <select 
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                    <option value="">Seleziona...</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            <div className="w-full md:w-auto flex-1">
                <label className="block text-xs text-slate-400 mb-1">Limite Mensile (€)</label>
                <input 
                    type="number" 
                    value={newLimit}
                    onChange={e => setNewLimit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Es. 500"
                />
            </div>
            <button 
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
                Salva
            </button>
        </form>
      )}

      <div className="space-y-4">
        {budgets.map(budget => {
            const spent = getSpentAmount(budget.category);
            const percentage = Math.min(100, (spent / budget.limit) * 100);
            let colorClass = 'bg-emerald-500';
            if (percentage > 50) colorClass = 'bg-yellow-500';
            if (percentage > 85) colorClass = 'bg-rose-500';

            return (
                <div key={budget.category} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-opacity-20 ${percentage > 100 ? 'bg-rose-500 text-rose-400' : 'bg-slate-500 text-slate-300'}`}>
                                {percentage > 100 ? <AlertCircle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{budget.category}</h4>
                                <p className="text-xs text-slate-400">Spesi €{spent.toFixed(0)} su €{budget.limit}</p>
                            </div>
                        </div>
                        <button onClick={() => onDeleteBudget(budget.category)} className="text-slate-600 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    {percentage > 90 && (
                        <p className="text-xs text-rose-400 mt-1 font-medium">Attenzione: Budget quasi esaurito!</p>
                    )}
                </div>
            );
        })}

        {budgets.length === 0 && !isEditing && (
            <p className="text-center text-slate-500 text-sm py-4">Nessun budget impostato.</p>
        )}
      </div>
    </div>
  );
};

export default BudgetsView;