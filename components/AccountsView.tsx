import React, { useState, useMemo } from 'react';
import { Account, Transaction } from '../types';
import { Plus, Landmark, CreditCard, Wallet, Banknote, Trash2, Search, AreaChart as AreaChartIcon, Calendar } from './Icons';
import AddAccountModal from './AddAccountModal';
import AccountDetailsModal from './AccountDetailsModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
}

const AccountsView: React.FC<AccountsViewProps> = ({ accounts, transactions, onAddAccount, onDeleteAccount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const liquidAssets = accounts
    .filter(a => a.type === 'bank' || a.type === 'cash')
    .reduce((acc, curr) => acc + curr.balance, 0);
  
  const creditCardDebt = accounts
    .filter(a => a.type === 'credit_card')
    .reduce((acc, curr) => acc + curr.balance, 0); // Usually negative

  // Chart Data for Distribution
  const distributionData = accounts.map(a => ({
      name: a.name,
      balance: a.balance,
      type: a.type
  }));

  // Chart Data for Historical Trend (Aggregated)
  const trendData = useMemo(() => {
      const data = [];
      // Filter transactions for the selected year up to today (or end of year)
      const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
      const sortedTx = [...yearTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // We need a starting point. This is tricky without full history.
      // Approximation: Current Balance - sum(all transactions after start of year) + sum(transactions in year up to point)
      // Better Approach: Current Balance is known. We can work backwards from today?
      // Or simpler: Just show flow relative to start of year = 0 if we don't track full history perfectly.
      // BEST EFFORT: Work backwards from current total balance.
      
      const currentTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
      let runningTotal = currentTotal;
      
      // Reverse chronological order to subtract/add back
      const allTxReverse = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Map of date -> balance
      const historyMap = new Map<string, number>();
      const todayStr = new Date().toISOString().split('T')[0];
      historyMap.set(todayStr, currentTotal);

      allTxReverse.forEach(tx => {
          if (tx.type === 'income') runningTotal -= tx.amount;
          else runningTotal += tx.amount;
          
          const dateStr = tx.date.split('T')[0];
          // We only care about points within the selected year
          if (new Date(dateStr).getFullYear() === selectedYear) {
             if (!historyMap.has(dateStr)) {
                 historyMap.set(dateStr, runningTotal + (tx.type === 'income' ? tx.amount : -tx.amount)); // Balance BEFORE this tx? No, balance at end of day.
                 // Actually easier: Set balance at date = runningTotal (which is state BEFORE current tx processed in reverse, i.e. AFTER tx in chronological)
                 // Wait, runningTotal is state BEFORE the transaction occurred (because we reversed).
                 // So for date T, the balance at end of T is the runningTotal BEFORE we subtracted T's effect? 
                 // No.
                 // Start: Current Balance (End of Today).
                 // Tx yesterday: Income 100.
                 // Balance Yesterday End = Current - 0? No.
                 // Let's use forward calculation. We need Start of Year Balance.
                 // Start Balance = Current Balance - (Sum of all Income since Start) + (Sum of all Expense since Start)
          }
        }
      });
      
      // Forward calculation
      const txSinceStartOfYear = transactions.filter(t => new Date(t.date) >= new Date(selectedYear, 0, 1));
      const netChangeSinceStart = txSinceStartOfYear.reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);
      const startOfYearBalance = currentTotal - netChangeSinceStart;

      let currentSimulated = startOfYearBalance;
      data.push({ date: '1 Gen', balance: startOfYearBalance });

      sortedTx.forEach(tx => {
          if (tx.type === 'income') currentSimulated += tx.amount;
          else currentSimulated -= tx.amount;
          
          data.push({
              date: new Date(tx.date).toLocaleDateString('it-IT', {day: '2-digit', month: 'short'}),
              balance: currentSimulated
          });
      });

      // If data is sparse, just show what we have. If empty (no tx this year), show flat line.
      if (data.length === 1) {
          data.push({ date: 'Oggi', balance: currentTotal });
      }

      return data;

  }, [transactions, accounts, selectedYear]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark className="w-6 h-6" />;
      case 'credit_card': return <CreditCard className="w-6 h-6" />;
      case 'cash': return <Banknote className="w-6 h-6" />;
      default: return <Wallet className="w-6 h-6" />;
    }
  };

  const getColor = (type: string) => {
      switch(type) {
          case 'bank': return 'bg-blue-500';
          case 'credit_card': return 'bg-amber-500';
          case 'cash': return 'bg-emerald-500';
          default: return 'bg-slate-500';
      }
  }

  return (
    <div className="space-y-6">
      {/* Totals & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 p-6 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
            <div>
                <p className="text-emerald-200 text-sm font-medium">Liquidità Totale (Bank + Cash)</p>
                <h3 className="text-3xl font-bold text-white mt-1">€ {liquidAssets.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-full">
                <Wallet className="w-8 h-8 text-emerald-400" />
            </div>
            </div>
            <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 p-6 rounded-2xl border border-amber-500/20 flex items-center justify-between">
            <div>
                <p className="text-amber-200 text-sm font-medium">Saldo Carte di Credito</p>
                <h3 className="text-3xl font-bold text-white mt-1">€ {creditCardDebt.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="bg-amber-500/20 p-3 rounded-full">
                <CreditCard className="w-8 h-8 text-amber-400" />
            </div>
            </div>
            
            {/* Trend Chart */}
            <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                        <AreaChartIcon className="w-4 h-4" /> Trend Liquidità {selectedYear}
                    </h4>
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded text-xs text-white px-2 py-1 focus:outline-none"
                    >
                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                             <option key={y} value={y}>{y}</option>
                         ))}
                    </select>
                </div>
                <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                                formatter={(value: number) => [`€ ${value.toLocaleString()}`, 'Saldo Totale']}
                            />
                            <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={2} />
                         </AreaChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Distribuzione Fondi</h4>
            <div className="h-full min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '10px' }} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                        <Bar dataKey="balance" radius={[0, 4, 4, 0]} barSize={20}>
                             {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.type === 'credit_card' ? '#f59e0b' : entry.type === 'cash' ? '#10b981' : '#3b82f6'} />
                             ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* List */}
      <div className="flex justify-between items-center pt-4">
        <h3 className="text-xl font-bold text-white">I tuoi Conti</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" /> Aggiungi Conto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <div 
            key={account.id} 
            onClick={() => setSelectedAccount(account)}
            className="bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 rounded-2xl p-5 transition-all relative group cursor-pointer shadow-sm hover:shadow-md"
          >
             <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${getColor(account.type)} bg-opacity-20 text-white`}>
                   {getIcon(account.type)}
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteAccount(account.id); }} 
                        className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-700 transition-colors"
                        title="Elimina Conto"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
             </div>
             <div>
                 <h4 className="text-lg font-bold text-slate-200">{account.name}</h4>
                 <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
                     {account.type === 'credit_card' ? 'Carta di Credito' : account.type === 'cash' ? 'Contanti' : 'Conto Corrente'}
                 </p>
                 <p className={`text-2xl font-bold ${account.balance < 0 ? 'text-rose-400' : 'text-white'}`}>
                     € {account.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                 </p>
             </div>
             <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                 <p className="text-xs text-slate-400">Clicca per i dettagli</p>
                 <Search className="w-4 h-4 text-slate-600" />
             </div>
          </div>
        ))}
      </div>

      <AddAccountModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddAccount}
      />

      <AccountDetailsModal 
        account={selectedAccount}
        transactions={transactions}
        onClose={() => setSelectedAccount(null)}
      />
    </div>
  );
};

export default AccountsView;