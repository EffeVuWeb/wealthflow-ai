import React, { useState } from 'react';
import { X, CalendarClock } from 'lucide-react';
import { Subscription } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
}

const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [nextDate, setNextDate] = useState('');
  const [category, setCategory] = useState('Abbonamenti');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost || !nextDate) return;

    onAdd({
      name,
      cost: parseFloat(cost),
      frequency,
      nextPaymentDate: new Date(nextDate).toISOString(),
      category,
      active: true
    });
    
    // Reset
    setName('');
    setCost('');
    setFrequency('monthly');
    setNextDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-violet-400" />
              <h2 className="text-xl font-bold text-white">Nuovo Abbonamento</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome Servizio</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="Es. Netflix, Palestra, iCloud..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Costo (€)</label>
              <input
                type="number"
                step="0.01"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Frequenza</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'monthly' | 'yearly')}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="monthly">Mensile</option>
                <option value="yearly">Annuale</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm text-slate-400 mb-1">Prossimo Rinnovo</label>
             <input
                type="date"
                required
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
             />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
            >
              {EXPENSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg shadow-violet-900/20"
          >
            Salva Abbonamento
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSubscriptionModal;