import React, { useState, useMemo } from 'react';
import { Subscription } from '../types';
import { Plus, Trash2, Repeat, CalendarClock, RefreshCw, TrendingUp } from './Icons';
import AddSubscriptionModal from './AddSubscriptionModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  onDeleteSubscription: (id: string) => void;
  onRenewSubscription: (sub: Subscription) => void;
}

const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ subscriptions, onAddSubscription, onDeleteSubscription, onRenewSubscription }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate Total Monthly Fixed Cost
  const monthlyFixedCost = subscriptions.reduce((acc, sub) => {
    if (!sub.active) return acc;
    if (sub.frequency === 'monthly') return acc + sub.cost;
    if (sub.frequency === 'yearly') return acc + (sub.cost / 12);
    return acc;
  }, 0);

  const chartData = useMemo(() => {
      const data: Record<string, number> = {};
      subscriptions.filter(s => s.active).forEach(s => {
          const monthlyCost = s.frequency === 'monthly' ? s.cost : s.cost / 12;
          data[s.category] = (data[s.category] || 0) + monthlyCost;
      });
      return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Costo Fisso Mensile</p>
                    <h3 className="text-2xl font-bold text-white mt-1">€ {monthlyFixedCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-slate-500 mt-1">Include quota mensile di sub annuali</p>
                </div>
                <div className="bg-violet-500/20 p-3 rounded-full">
                    <Repeat className="w-6 h-6 text-violet-400" />
                </div>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm">Totale Annuo Proiettato</p>
                    <h3 className="text-2xl font-bold text-white mt-1">€ {(monthlyFixedCost * 12).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-rose-500/20 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-rose-400" />
                </div>
            </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
             <p className="text-xs text-slate-400 mb-2 text-center uppercase font-bold">Costo Mensile per Categoria</p>
             <div className="h-24 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData}>
                         <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '10px' }} />
                         <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                     </BarChart>
                 </ResponsiveContainer>
             </div>
        </div>
      </div>

      {/* Header & Add Button */}
      <div className="flex justify-between items-center pt-4">
        <h3 className="text-xl font-bold text-white">I tuoi Abbonamenti</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-violet-900/20"
        >
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subscriptions.map(sub => {
            const nextDate = new Date(sub.nextPaymentDate);
            const today = new Date();
            const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0;
            const isDueSoon = daysLeft >= 0 && daysLeft <= 3;

            return (
                <div key={sub.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex justify-between items-center hover:border-violet-500/40 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
                            {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg">{sub.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span className={`font-medium ${sub.frequency === 'monthly' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                    {sub.frequency === 'monthly' ? 'Mensile' : 'Annuale'}
                                </span>
                                <span>•</span>
                                <span className={`${isOverdue ? 'text-rose-400 font-bold' : isDueSoon ? 'text-amber-400 font-bold' : ''}`}>
                                    {isOverdue ? 'Scaduto!' : `Scade il ${nextDate.toLocaleDateString()}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-xl font-bold text-white">€ {sub.cost.toFixed(2)}</p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onRenewSubscription(sub)}
                                className="bg-slate-700 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 group-pay"
                                title="Registra pagamento e rinnova data"
                            >
                                <RefreshCw className="w-4 h-4 group-pay-hover:rotate-180 transition-transform" />
                                <span className="hidden md:inline">Paga</span>
                            </button>
                            <button 
                                onClick={() => onDeleteSubscription(sub.id)}
                                className="bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white p-2 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        })}

        {subscriptions.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl">
                <CalendarClock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">Non hai ancora inserito abbonamenti.</p>
            </div>
        )}
      </div>

      <AddSubscriptionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddSubscription}
      />
    </div>
  );
};

export default SubscriptionsView;