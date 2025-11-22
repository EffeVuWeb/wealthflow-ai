import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account, AccountType } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: Omit<Account, 'id'>) => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    const val = parseFloat(balance);

    onAdd({
      name,
      type,
      initialBalance: val,
      balance: val, // Will be overwritten by recalculation in App.tsx
      color: 'blue' // Default color, could be expanded
    });
    
    setName('');
    setBalance('');
    setType('bank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Aggiungi Conto / Carta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome Conto</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="Es. Fineco Principale, Cash, Visa..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('bank')}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${type === 'bank' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                Banca
              </button>
              <button
                type="button"
                onClick={() => setType('cash')}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${type === 'cash' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                Contanti
              </button>
              <button
                type="button"
                onClick={() => setType('credit_card')}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${type === 'credit_card' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                Carta Credito
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Saldo Iniziale (€)</label>
            <p className="text-xs text-slate-500 mb-2">Per le Carte di Credito, inserisci un valore negativo se hai già speso (es. -200).</p>
            <input
              type="number"
              step="0.01"
              required
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="0.00"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors mt-4"
          >
            Salva Conto
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;