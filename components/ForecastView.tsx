import React, { useMemo } from 'react';
import { Transaction, Subscription, Loan, Account } from '../types';
import { LineChart, TrendingUp, TrendingDown, AlertCircle } from './Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ForecastViewProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  loans: Loan[];
  accounts: Account[];
}

const ForecastView: React.FC<ForecastViewProps> = ({ transactions, subscriptions, loans, accounts }) => {
  
  const forecastData = useMemo(() => {
    // 1. Calculate Baseline (Current Liquid Assets)
    const currentLiquidity = accounts
        .filter(a => a.type === 'bank' || a.type === 'cash')
        .reduce((sum, a) => sum + a.balance, 0);

    // 2. Calculate Average Monthly Income & Variable Expenses (Last 3 Months)
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const recentTx = transactions.filter(t => new Date(t.date) >= threeMonthsAgo);
    
    const totalIncome = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    // We filter out 'Finanziamenti' and 'Abbonamenti' categories from expenses because we calculate them precisely later
    const variableExpenses = recentTx
        .filter(t => t.type === 'expense' && t.category !== 'Finanziamenti' && t.category !== 'Abbonamenti')
        .reduce((s, t) => s + t.amount, 0);

    const avgMonthlyIncome = totalIncome / 3;
    const avgMonthlyVarExpense = variableExpenses / 3;

    // 3. Calculate Fixed Costs (Loans + Subs)
    const monthlyLoanCost = loans.reduce((s, l) => s + l.monthlyPayment, 0);
    const monthlySubCost = subscriptions
        .filter(s => s.active)
        .reduce((s, sub) => s + (sub.frequency === 'monthly' ? sub.cost : sub.cost / 12), 0);

    const totalMonthlyFixed = monthlyLoanCost + monthlySubCost;
    const netMonthlyFlow = avgMonthlyIncome - (avgMonthlyVarExpense + totalMonthlyFixed);

    // 4. Generate 6-Month Projection
    const data = [];
    let runningBalance = currentLiquidity;

    for (let i = 0; i <= 5; i++) {
        const date = new Date();
        date.setMonth(now.getMonth() + i);
        
        const monthName = date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
        
        data.push({
            name: monthName,
            balance: runningBalance,
            income: avgMonthlyIncome,
            expense: avgMonthlyVarExpense + totalMonthlyFixed
        });

        runningBalance += netMonthlyFlow;
    }

    return { data, netMonthlyFlow, avgMonthlyIncome, avgMonthlyVarExpense, totalMonthlyFixed };
  }, [transactions, subscriptions, loans, accounts]);

  const isPositive = forecastData.netMonthlyFlow >= 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
              <LineChart className="w-8 h-8 text-indigo-400" />
              <div>
                  <h2 className="text-2xl font-bold text-white">Cash Flow Forecast</h2>
                  <p className="text-slate-400 text-sm">Proiezione della tua liquidità nei prossimi 6 mesi.</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase">Entrate Medie</p>
                  <p className="text-lg font-bold text-emerald-400">+ € {forecastData.avgMonthlyIncome.toFixed(0)}</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase">Spese Totali Stim.</p>
                  <p className="text-lg font-bold text-rose-400">- € {(forecastData.avgMonthlyVarExpense + forecastData.totalMonthlyFixed).toFixed(0)}</p>
                  <p className="text-[10px] text-slate-500">Fisse: €{forecastData.totalMonthlyFixed.toFixed(0)} | Var: €{forecastData.avgMonthlyVarExpense.toFixed(0)}</p>
              </div>
              <div className={`bg-slate-800/50 rounded-xl p-4 border ${isPositive ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                  <p className="text-xs text-slate-400 uppercase">Trend Mensile</p>
                  <div className="flex items-center gap-2">
                      {isPositive ? <TrendingUp className="text-emerald-400 w-5 h-5" /> : <TrendingDown className="text-rose-400 w-5 h-5" />}
                      <p className={`text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''} € {forecastData.netMonthlyFlow.toFixed(0)} / mese
                      </p>
                  </div>
              </div>
          </div>

          <div className="h-80 w-full bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => `€${val/1000}k`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} 
                        formatter={(value: number) => [`€ ${value.toLocaleString()}`, 'Saldo Stimato']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke={isPositive ? "#10b981" : "#f43f5e"} 
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-start gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200">
                  <strong>Nota:</strong> Questa proiezione si basa sulla media delle tue spese degli ultimi 3 mesi e sui costi fissi inseriti (prestiti e abbonamenti). Eventuali spese impreviste non sono calcolate.
              </p>
          </div>
      </div>
    </div>
  );
};

export default ForecastView;