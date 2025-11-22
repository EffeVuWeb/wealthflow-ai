import React, { useState } from 'react';
import { RecurringTransaction, Account, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { Zap, Plus, Trash2, Calendar, ArrowRight, Briefcase } from './Icons';

interface RecurringViewProps {
  recurringRules: RecurringTransaction[];
  accounts: Account[];
  onAddRule: (rule: Omit<RecurringTransaction, 'id'>) => void;
  onDeleteRule: (id: string) => void;
}

const RecurringView: React.FC<RecurringViewProps> = ({ recurringRules, accounts, onAddRule, onDeleteRule }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !accountId || !startDate) return;

    onAddRule({
      description,
      amount: parseFloat(amount),
      type,
      category,
      accountId,
      frequency,
      startDate: new Date(startDate).toISOString(),
      nextRunDate: new Date(startDate).toISOString(), // First run is the start date
      active: true,
      isBusiness
    });

    // Reset
    setDescription('');
    setAmount('');
    setStartDate('');
    setIsAdding(false);
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-900/40 to-yellow-900/40 p-6 rounded-2xl border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-amber-500/20 p-3 rounded-full">
                <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white">Automazioni</h2>
                <p className="text-amber-200 text-sm">Imposta regole per generare automaticamente le transazioni ripetitive.</p>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <h3 className="text-xl font-bold text-white">Le tue Regole</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-4 h-4" /> Nuova Regola
        </button>
      </div>

      {isAdding && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
              <h4 className="text-white font-bold mb-4">Nuova Automazione</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Descrizione</label>
                          <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="Es. Affitto, Stipendio..." />
                      </div>
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Importo (€)</label>
                          <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="0.00" />
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                          <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white">
                              <option value="expense">Spesa</option>
                              <option value="income">Entrata</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                          <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white">
                              <option value="">Seleziona...</option>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Conto</label>
                          <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white">
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Frequenza</label>
                          <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white">
                              <option value="monthly">Mensile</option>
                              <option value="yearly">Annuale</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Data Inizio / Prossima Esecuzione</label>
                          <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                        <input type="checkbox" id="biz" checked={isBusiness} onChange={e => setIsBusiness(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600" />
                        <label htmlFor="biz" className="text-sm text-slate-300 flex items-center gap-2 cursor-pointer"><Briefcase className="w-4 h-4" /> Transazione Business / P.IVA</label>
                  </div>

                  <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Annulla</button>
                      <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-bold">Salva Regola</button>
                  </div>
              </form>
          </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {recurringRules.map(rule => {
            const accName = accounts.find(a => a.id === rule.accountId)?.name || 'Conto eliminato';
            return (
                <div key={rule.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rule.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-white font-bold text-lg">{rule.description}</h4>
                                {rule.isBusiness && <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 rounded font-bold">BIZ</span>}
                            </div>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{rule.category}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span className="text-slate-300">{accName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                            <p className={`text-xl font-bold ${rule.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {rule.type === 'income' ? '+' : '-'}€ {rule.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                <Calendar className="w-3 h-3" /> Prossima: {new Date(rule.nextRunDate).toLocaleDateString()}
                            </p>
                        </div>
                        <button onClick={() => onDeleteRule(rule.id)} className="p-2 text-slate-500 hover:text-rose-400 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            );
        })}
        {recurringRules.length === 0 && !isAdding && (
            <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl">
                <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">Nessuna automazione attiva.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RecurringView;