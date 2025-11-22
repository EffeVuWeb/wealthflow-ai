import React, { useState } from 'react';
import { Goal } from '../types';
import { Target, Plus, Trash2, TrendingUp } from './Icons';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateAmount: (id: string, amount: number) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, onAddGoal, onDeleteGoal, onUpdateAmount }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && target) {
      onAddGoal({
        name,
        targetAmount: parseFloat(target),
        currentAmount: current ? parseFloat(current) : 0,
        deadline: deadline || undefined,
        color: 'blue'
      });
      setName('');
      setTarget('');
      setCurrent('');
      setDeadline('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-rose-400" />
            Obiettivi di Risparmio
        </h3>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Nuovo Obiettivo
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
            <div>
                <label className="block text-xs text-slate-400 mb-1">Nome Obiettivo</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Es. Viaggio..." />
            </div>
            <div>
                <label className="block text-xs text-slate-400 mb-1">Target (€)</label>
                <input type="number" required value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="0.00" />
            </div>
            <div>
                <label className="block text-xs text-slate-400 mb-1">Già risparmiati (€)</label>
                <input type="number" value={current} onChange={e => setCurrent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="0.00" />
            </div>
            <div>
                <label className="block text-xs text-slate-400 mb-1">Data Scadenza (Opz)</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <button type="submit" className="md:col-span-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Crea Obiettivo</button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {goals.map(goal => {
            const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            return (
                <div key={goal.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative group">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h4 className="font-bold text-white text-lg">{goal.name}</h4>
                            {goal.deadline && (
                                <p className="text-xs text-slate-400">Scadenza: {new Date(goal.deadline).toLocaleDateString()}</p>
                            )}
                        </div>
                        <button onClick={() => onDeleteGoal(goal.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="flex items-end justify-between mb-1">
                         <span className="text-emerald-400 font-bold text-xl">€ {goal.currentAmount.toLocaleString()}</span>
                         <span className="text-slate-500 text-sm">su € {goal.targetAmount.toLocaleString()}</span>
                    </div>

                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden relative">
                        <div className="bg-gradient-to-r from-rose-500 to-orange-400 h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                        <button 
                            onClick={() => onUpdateAmount(goal.id, goal.currentAmount + 50)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition-colors"
                        >
                            + €50
                        </button>
                        <button 
                            onClick={() => onUpdateAmount(goal.id, goal.currentAmount + 100)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition-colors"
                        >
                            + €100
                        </button>
                    </div>
                </div>
            );
        })}
        {goals.length === 0 && !isAdding && (
            <p className="text-center text-slate-500 text-sm py-4">Nessun obiettivo attivo.</p>
        )}
      </div>
    </div>
  );
};

export default GoalsView;