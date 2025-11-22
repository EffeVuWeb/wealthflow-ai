import React, { useState } from 'react';
import { Debt, Account } from '../types';
import { Plus, Trash2, HandCoins, Calendar, CheckCircle, AlertCircle, UserMinus, Handshake, Check } from './Icons';
import AddDebtModal from './AddDebtModal';

interface DebtsViewProps {
  debts: Debt[];
  accounts: Account[];
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onDeleteDebt: (id: string) => void;
  onPayDebt: (debt: Debt, accountId: string) => void;
}

const DebtsView: React.FC<DebtsViewProps> = ({ debts, accounts, onAddDebt, onDeleteDebt, onPayDebt }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payModal, setPayModal] = useState<{ isOpen: boolean, debt: Debt | null }>({ isOpen: false, debt: null });
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');

  const activeDebts = debts.filter(d => !d.isPaid);
  const totalDebt = activeDebts.reduce((acc, d) => acc + d.amount, 0);

  const handlePayClick = (debt: Debt) => {
      setPayModal({ isOpen: true, debt });
      if (accounts.length > 0 && !selectedAccount) setSelectedAccount(accounts[0].id);
  };

  const confirmPayment = () => {
      if (payModal.debt && selectedAccount) {
          onPayDebt(payModal.debt, selectedAccount);
          setPayModal({ isOpen: false, debt: null });
      }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 p-6 rounded-2xl border border-orange-500/20 flex items-center justify-between">
        <div>
          <p className="text-orange-200 text-sm font-medium">Totale Debiti Personali</p>
          <h3 className="text-3xl font-bold text-white mt-1">€ {totalDebt.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs text-orange-300/70 mt-1">Esclusi finanziamenti bancari</p>
        </div>
        <div className="bg-orange-500/20 p-3 rounded-full">
          <HandCoins className="w-8 h-8 text-orange-400" />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <h3 className="text-xl font-bold text-white">I tuoi Debiti</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-orange-900/20"
        >
          <Plus className="w-4 h-4" /> Aggiungi Debito
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeDebts.map((debt) => {
            const daysLeft = debt.dueDate ? Math.ceil((new Date(debt.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
            const isOverdue = daysLeft !== null && daysLeft < 0;

            return (
                <div key={debt.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden hover:border-orange-500/30 transition-colors">
                    {isOverdue && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">SCADUTO</div>}
                    
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                <UserMinus className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">{debt.creditorName}</h4>
                                <p className="text-sm text-slate-400">{debt.description}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-white">€ {debt.amount.toFixed(2)}</p>
                            {debt.dueDate && (
                                <p className={`text-xs flex items-center justify-end gap-1 ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                                    <Calendar className="w-3 h-3" /> {new Date(debt.dueDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                        <button 
                            onClick={() => handlePayClick(debt)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Handshake className="w-4 h-4" /> Salda Debito
                        </button>
                        <button 
                            onClick={() => onDeleteDebt(debt.id)}
                            className="p-2 bg-slate-700 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
        })}

        {activeDebts.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl">
                <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Nessun debito attivo!</p>
                <p className="text-slate-500 text-sm">Sei libero da debiti personali.</p>
            </div>
        )}
      </div>

      <AddDebtModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddDebt}
      />

      {/* Pay Modal */}
      {payModal.isOpen && payModal.debt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Salda Debito</h3>
                  <p className="text-slate-400 text-sm mb-4">
                      Stai restituendo <strong>€ {payModal.debt.amount}</strong> a <strong>{payModal.debt.creditorName}</strong>.
                      <br/>Da quale conto prelevi i soldi?
                  </p>
                  
                  <div className="mb-6">
                      <label className="block text-xs text-slate-500 mb-1">Conto di Addebito</label>
                      <select 
                          value={selectedAccount} 
                          onChange={(e) => setSelectedAccount(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-emerald-500 outline-none"
                      >
                          {accounts.filter(a => a.type === 'bank' || a.type === 'cash').map(a => (
                              <option key={a.id} value={a.id}>{a.name} (€ {a.balance.toFixed(2)})</option>
                          ))}
                      </select>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setPayModal({ isOpen: false, debt: null })} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700">Annulla</button>
                      <button onClick={confirmPayment} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Conferma Pagamento
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DebtsView;