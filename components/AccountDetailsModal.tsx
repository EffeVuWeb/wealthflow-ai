import React, { useMemo } from 'react';
import { Account, Transaction } from '../types';
import { X, TrendingUp, TrendingDown, CreditCard, Landmark, Wallet, AreaChart as AreaChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AccountDetailsModalProps {
  account: Account | null;
  transactions: Transaction[];
  onClose: () => void;
}

const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({ account, transactions, onClose }) => {
  if (!account) return null;

  // Filter transactions for this account
  const accountTransactions = transactions
    .filter(t => t.accountId === account.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate Historical Balance Data
  const balanceHistory = useMemo(() => {
      const data = [];
      // Sort ASC for calculation
      const sortedTx = [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let currentBal = account.initialBalance;
      
      // Add initial point
      data.push({ date: 'Start', balance: currentBal });

      // Add point for each transaction
      sortedTx.forEach(tx => {
          if (tx.type === 'income') currentBal += tx.amount;
          else currentBal -= tx.amount;
          
          data.push({
              date: new Date(tx.date).toLocaleDateString('it-IT', {day: '2-digit', month: 'short'}),
              fullDate: tx.date,
              balance: currentBal
          });
      });
      
      // Take last 20 points to avoid clutter if too many
      return data.slice(-30);
  }, [accountTransactions, account.initialBalance]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark className="w-6 h-6 text-blue-400" />;
      case 'credit_card': return <CreditCard className="w-6 h-6 text-amber-400" />;
      default: return <Wallet className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                {getIcon(account.type)}
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">{account.name}</h2>
                <p className="text-sm text-slate-400 capitalize">{account.type === 'credit_card' ? 'Carta di Credito' : account.type === 'bank' ? 'Conto Bancario' : 'Contanti'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance Section */}
        <div className="p-6 bg-slate-800/50">
            <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Saldo Attuale</span>
                <span className={`text-3xl font-bold ${account.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    € {account.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
            </div>
            {account.type === 'credit_card' && (
                <p className="text-xs text-slate-500 mt-2">
                    Un saldo negativo indica l'utilizzo del plafond (debito accumulato).
                </p>
            )}
        </div>

        {/* Chart Section */}
        <div className="p-4 border-b border-slate-800">
             <div className="flex items-center gap-2 mb-2 px-2">
                 <AreaChartIcon className="w-4 h-4 text-blue-400" />
                 <p className="text-xs font-bold text-slate-400 uppercase">Andamento Saldo</p>
             </div>
             <div className="h-40 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={balanceHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                            formatter={(value: number) => [`€ ${value.toLocaleString()}`, 'Saldo']}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBal)" strokeWidth={2} />
                     </AreaChart>
                 </ResponsiveContainer>
             </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Ultimi Movimenti</h3>
            
            {accountTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <p>Nessuna transazione registrata su questo conto.</p>
                </div>
            ) : (
                accountTransactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">{tx.description || tx.category}</p>
                                <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()} • {tx.category}</p>
                            </div>
                        </div>
                        <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.type === 'income' ? '+' : '-'} € {tx.amount.toFixed(2)}
                        </span>
                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  );
};

export default AccountDetailsModal;