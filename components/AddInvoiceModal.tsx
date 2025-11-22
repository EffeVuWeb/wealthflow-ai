import React, { useState } from 'react';
import { X, FilePlus } from 'lucide-react';
import { Invoice } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (invoice: Omit<Invoice, 'id'>) => void;
}

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState<'issued' | 'received'>('issued');
  const [number, setNumber] = useState('');
  const [entityName, setEntityName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent'>('draft');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!number || !entityName || !amount) return;

    onAdd({
      number,
      date: new Date(date).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(date).toISOString(), // Default due date same as date if empty
      entityName,
      amount: parseFloat(amount),
      type,
      status,
      category: type === 'received' ? 'Servizi Web' : 'Freelance' // Default categories
    });
    
    // Reset
    setNumber('');
    setEntityName('');
    setAmount('');
    setDueDate('');
    setType('issued');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FilePlus className="text-blue-400" /> 
            {type === 'issued' ? 'Emetti Fattura' : 'Registra Fattura Ricevuta'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           {/* Type Switcher */}
           <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setType('issued')}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${type === 'issued' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Fattura Emessa (Cliente)
            </button>
            <button
              type="button"
              onClick={() => setType('received')}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${type === 'received' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Fattura Ricevuta (Fornitore)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm text-slate-400 mb-1">Numero</label>
                <input
                type="text"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder={type === 'issued' ? "Es. 1/2025" : "Es. A-402"}
                />
             </div>
             <div>
                <label className="block text-sm text-slate-400 mb-1">Data</label>
                <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{type === 'issued' ? 'Cliente' : 'Fornitore'}</label>
            <input
              type="text"
              required
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder={type === 'issued' ? "Ragione Sociale Cliente" : "Ragione Sociale Fornitore"}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Importo Totale (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-lg"
              placeholder="0.00"
            />
          </div>

          <div>
                <label className="block text-sm text-slate-400 mb-1">Scadenza Pagamento</label>
                <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
          </div>

          <div>
              <label className="block text-sm text-slate-400 mb-1">Stato Iniziale</label>
              <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                  <option value="draft">Bozza</option>
                  <option value="sent">{type === 'issued' ? 'Emessa / Inviata' : 'Ricevuta / Da Pagare'}</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                  Nota: Potrai segnarla come "Pagata" e registrare l'incasso successivamente dalla lista fatture.
              </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-4"
          >
            Salva Fattura
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddInvoiceModal;