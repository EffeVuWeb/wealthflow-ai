import React, { useState, useMemo } from 'react';
import { Investment } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCcw, Bitcoin, Gem, CircleDollarSign, Landmark } from './Icons';
import AddInvestmentModal from './AddInvestmentModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface InvestmentsViewProps {
  investments: Investment[];
  onAddInvestment: (inv: Omit<Investment, 'id'>) => void;
  onDeleteInvestment: (id: string) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#6366f1'];

const InvestmentsView: React.FC<InvestmentsViewProps> = ({ investments, onAddInvestment, onDeleteInvestment, onUpdatePrice }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');

  const summary = useMemo(() => {
      let totalValue = 0;
      let totalCost = 0;
      const allocation: Record<string, number> = {};

      investments.forEach(inv => {
          const value = inv.quantity * inv.currentPrice;
          const cost = inv.quantity * inv.averageBuyPrice;
          
          totalValue += value;
          totalCost += cost;
          allocation[inv.category] = (allocation[inv.category] || 0) + value;
      });

      return {
          totalValue,
          totalCost,
          pnl: totalValue - totalCost,
          pnlPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
          allocation: Object.entries(allocation).map(([name, value]) => ({ name, value }))
      };
  }, [investments]);

  const getIcon = (category: string) => {
      switch(category) {
          case 'Crypto': return <Bitcoin className="w-5 h-5" />;
          case 'Stocks': return <TrendingUp className="w-5 h-5" />;
          case 'Real Estate': return <Landmark className="w-5 h-5" />;
          case 'Commodities': return <Gem className="w-5 h-5" />;
          default: return <CircleDollarSign className="w-5 h-5" />;
      }
  };

  const handlePriceSave = (id: string) => {
      if (tempPrice) {
          onUpdatePrice(id, parseFloat(tempPrice));
          setEditingId(null);
          setTempPrice('');
      }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 p-6 rounded-2xl border border-violet-500/20 flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-sm font-medium">Valore Portafoglio</p>
            <h3 className="text-3xl font-bold text-white mt-1">€ {summary.totalValue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-violet-500/20 p-3 rounded-full">
            <Gem className="w-8 h-8 text-violet-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
           <div>
               <p className="text-slate-400 text-sm">Profitto / Perdita (Totale)</p>
               <div className="flex items-end gap-2">
                   <h3 className={`text-2xl font-bold mt-1 ${summary.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {summary.pnl >= 0 ? '+' : ''}€ {summary.pnl.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                   </h3>
                   <span className={`text-sm font-medium mb-1 ${summary.pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                       ({summary.pnlPercent >= 0 ? '+' : ''}{summary.pnlPercent.toFixed(2)}%)
                   </span>
               </div>
           </div>
           <div className={`p-3 rounded-full ${summary.pnl >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
               {summary.pnl >= 0 ? <TrendingUp className={`w-6 h-6 ${summary.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} /> : <TrendingDown className="w-6 h-6 text-rose-400" />}
           </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
             <p className="text-xs text-slate-400 mb-2 text-center uppercase font-bold">Asset Allocation</p>
             <div className="h-24 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                         <Pie data={summary.allocation} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value">
                            {summary.allocation.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                         </Pie>
                         <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '10px' }} formatter={(value: number) => `€ ${value.toFixed(0)}`} />
                     </PieChart>
                 </ResponsiveContainer>
             </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center pt-4">
        <h3 className="text-xl font-bold text-white">I tuoi Asset</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-violet-900/20"
        >
          <Plus className="w-4 h-4" /> Aggiungi Asset
        </button>
      </div>

      {/* Asset List */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                <tr>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Quantità</th>
                    <th className="px-6 py-4">Prezzo Attuale</th>
                    <th className="px-6 py-4">Valore Totale</th>
                    <th className="px-6 py-4">P&L</th>
                    <th className="px-6 py-4 text-right">Azioni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
                {investments.map(inv => {
                    const currentValue = inv.quantity * inv.currentPrice;
                    const costBasis = inv.quantity * inv.averageBuyPrice;
                    const gain = currentValue - costBasis;
                    const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

                    return (
                        <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-700 rounded-lg text-slate-300">
                                        {getIcon(inv.category)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{inv.name}</p>
                                        <p className="text-xs text-slate-500">{inv.symbol} • {inv.category}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-sm">{inv.quantity}</td>
                            <td className="px-6 py-4">
                                {editingId === inv.id ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            autoFocus
                                            className="w-20 bg-slate-900 border border-blue-500 rounded px-2 py-1 text-xs text-white outline-none"
                                            value={tempPrice}
                                            onChange={(e) => setTempPrice(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePriceSave(inv.id)}
                                        />
                                        <button onClick={() => handlePriceSave(inv.id)} className="text-emerald-400 hover:text-emerald-300"><TrendingUp className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingId(inv.id); setTempPrice(inv.currentPrice.toString()); }}>
                                        <span className="text-sm">€ {inv.currentPrice.toLocaleString()}</span>
                                        <RefreshCcw className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-500">Agg: {new Date(inv.lastUpdated).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-white">€ {currentValue.toLocaleString('it-IT', {minimumFractionDigits: 2})}</td>
                            <td className="px-6 py-4">
                                <div className={`text-sm font-bold ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {gain >= 0 ? '+' : ''}€ {gain.toLocaleString('it-IT', {maximumFractionDigits: 0})}
                                </div>
                                <div className={`text-xs ${gainPercent >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                    {gainPercent.toFixed(2)}%
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => onDeleteInvestment(inv.id)} className="text-slate-500 hover:text-rose-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    );
                })}
                {investments.length === 0 && (
                    <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                            Non hai ancora aggiunto investimenti. Inizia a tracciare il tuo portfolio!
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
      </div>

      <AddInvestmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={onAddInvestment} 
      />
    </div>
  );
};

export default InvestmentsView;