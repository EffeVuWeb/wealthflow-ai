import React, { useState } from 'react';
import { X, HandCoins, UserMinus } from './Icons';
import { Debt } from '../types';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (debt: Omit<Debt, 'id'>) => void;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [creditorName, setCreditorName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditorName || !amount) return;

    onAdd({
      creditorName,
      amount: parseFloat(amount),
      dueDate: dueDate || undefined,
      description: description || 'Debito Personale',
      isPaid: false
    });
    
    setCreditorName('');
    setAmount('');
    setDueDate('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
              <HandCoins className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl font-bold text-white">Nuovo Debito Personale</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Creditore (A chi devi i soldi?)</label>
            <input
              type="text"
              required
              value={creditorName}
              onChange={(e) => setCreditorName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              placeholder="Es. Marco Rossi, Zio Pino..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Importo (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 text-lg font-bold"
              placeholder="0.00"
            />
          </div>

          <div>
             <label className="block text-sm text-slate-400 mb-1">Descrizione / Motivo</label>
             <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="Es. Cena offerta, Prestito..."
             />
          </div>

          <div>
              <label className="block text-sm text-slate-400 mb-1">Scadenza (Opzionale)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2"
          >
            <UserMinus className="w-5 h-5" /> Aggiungi Debito
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDebtModal;