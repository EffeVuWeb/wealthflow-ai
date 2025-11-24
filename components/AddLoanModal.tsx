import React, { useState } from 'react';
import { X, Calendar, Bell, Wallet } from 'lucide-react';
import { Loan, Account } from '../types';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (loan: Omit<Loan, 'id'>) => void;
  accounts: Account[];
}

const AddLoanModal: React.FC<AddLoanModalProps> = ({ isOpen, onClose, onAdd, accounts }) => {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalAmount || !monthlyPayment) return;

    const total = parseFloat(totalAmount);
    // If remaining is not set, assume it's a new loan starting at total
    const remaining = remainingAmount ? parseFloat(remainingAmount) : total;

    onAdd({
      name,
      totalAmount: total,
      remainingAmount: remaining,
      monthlyPayment: parseFloat(monthlyPayment),
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      nextPaymentDate: nextPaymentDate || undefined,
      reminderEnabled,
      paymentAccountId: paymentAccountId || undefined
    });

    // Reset
    setName('');
    setTotalAmount('');
    setRemainingAmount('');
    setMonthlyPayment('');
    setInterestRate('');
    setNextPaymentDate('');
    setReminderEnabled(false);
    setPaymentAccountId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Nuovo Finanziamento</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome Finanziamento</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="Es. Mutuo Casa, Rata Auto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Importo Totale (€)</label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Rata Mensile (€)</label>
              <input
                type="number"
                step="0.01"
                required
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Residuo (€)</label>
              <input
                type="number"
                step="0.01"
                value={remainingAmount}
                onChange={(e) => setRemainingAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="Lascia vuoto se nuovo"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tasso % (Opz)</label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="Es. 3.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Prossima Scadenza</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Conto di Pagamento (Opzionale)</label>
            <div className="relative">
              <Wallet className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Seleziona conto...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (€{acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1">Da quale conto verranno pagate le rate?</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`p-2 rounded-lg transition-colors ${reminderEnabled ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
              <Bell className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-medium text-white">Attiva Promemoria</p>
              <p className="text-xs text-slate-400">Avvisami quando la rata è in scadenza</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg shadow-violet-900/20"
          >
            Salva Finanziamento
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLoanModal;