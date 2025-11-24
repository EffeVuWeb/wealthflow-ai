import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { Target, Plus, Trash2, TrendingUp, Calendar, Award, Sparkles, X } from './Icons';
import { calculateMilestones, predictGoalCompletion, getNextMilestone } from '../services/milestoneService';

interface GoalsViewProps {
    goals: Goal[];
    transactions: any[];
    onAddGoal: (goal: Omit<Goal, 'id'>) => void;
    onDeleteGoal: (id: string) => void;
    onUpdateAmount: (id: string, amount: number) => void;
    onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, transactions, onAddGoal, onDeleteGoal, onUpdateAmount, onUpdateGoal }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [current, setCurrent] = useState('');
    const [deadline, setDeadline] = useState('');
    const [celebrationGoal, setCelebrationGoal] = useState<Goal | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Check for new milestones when goals update
    useEffect(() => {
        goals.forEach(goal => {
            const nextMilestone = getNextMilestone(goal);
            if (nextMilestone) {
                // Celebrate!
                setCelebrationGoal(goal);
                setShowConfetti(true);

                // Update goal to mark milestone as celebrated
                onUpdateGoal(goal.id, { lastCelebrated: nextMilestone.percentage });

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    setShowConfetti(false);
                    setCelebrationGoal(null);
                }, 5000);
            }
        });
    }, [goals.map(g => g.currentAmount).join(',')]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && target) {
            onAddGoal({
                name,
                targetAmount: parseFloat(target),
                currentAmount: current ? parseFloat(current) : 0,
                deadline: deadline || undefined,
                color: 'blue',
                createdAt: new Date().toISOString(),
                lastCelebrated: 0
            });
            setName('');
            setTarget('');
            setCurrent('');
            setDeadline('');
            setIsAdding(false);
        }
    };

    const getMilestoneColor = (percentage: number): string => {
        if (percentage >= 100) return 'from-yellow-400 to-amber-500';
        if (percentage >= 75) return 'from-yellow-500 to-orange-400';
        if (percentage >= 50) return 'from-cyan-500 to-blue-500';
        if (percentage >= 25) return 'from-blue-500 to-indigo-500';
        return 'from-slate-600 to-slate-700';
    };

    return (
        <div className="space-y-6">
            {/* Celebration Modal */}
            {showConfetti && celebrationGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-500 rounded-3xl p-8 max-w-md mx-4 relative overflow-hidden animate-in zoom-in">
                        {/* Confetti Effect */}
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: '-10px',
                                        animationDelay: `${Math.random() * 0.5}s`,
                                        animationDuration: `${2 + Math.random()}s`
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => { setShowConfetti(false); setCelebrationGoal(null); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center relative z-10">
                            <div className="mb-4 flex justify-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center animate-bounce">
                                    <Award className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {getNextMilestone(celebrationGoal)?.message}
                            </h3>
                            <p className="text-slate-300 text-sm">
                                Continua così! Stai facendo un ottimo lavoro! 🎉
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                    const milestones = calculateMilestones(goal);
                    const prediction = predictGoalCompletion(goal, transactions);
                    const isCompleted = percent >= 100;

                    return (
                        <div key={goal.id} className={`bg-slate-800/50 border rounded-xl p-5 relative group transition-all ${isCompleted ? 'border-yellow-500/50 shadow-lg shadow-yellow-900/20' : 'border-slate-700'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white text-lg">{goal.name}</h4>
                                        {isCompleted && <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />}
                                    </div>
                                    {goal.deadline && (
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            Scadenza: {new Date(goal.deadline).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => onDeleteGoal(goal.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-end justify-between mb-2">
                                <span className="text-emerald-400 font-bold text-2xl">€ {goal.currentAmount.toLocaleString()}</span>
                                <span className="text-slate-500 text-sm">su € {goal.targetAmount.toLocaleString()}</span>
                            </div>

                            {/* Progress Bar with Milestones */}
                            <div className="relative mb-4">
                                <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden relative">
                                    <div
                                        className={`bg-gradient-to-r ${getMilestoneColor(percent)} h-full rounded-full transition-all duration-1000 ease-out`}
                                        style={{ width: `${percent}%` }}
                                    />

                                    {/* Milestone Indicators */}
                                    {[25, 50, 75, 100].map(milestone => (
                                        <div
                                            key={milestone}
                                            className="absolute top-0 h-full flex items-center"
                                            style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
                                        >
                                            <div className={`w-1 h-full ${percent >= milestone ? 'bg-white/30' : 'bg-slate-700'}`} />
                                            <div className={`absolute -top-6 text-[10px] font-bold ${percent >= milestone ? 'text-yellow-400' : 'text-slate-600'}`}>
                                                {milestone === 100 ? '🏆' : milestone === 75 ? '⭐' : milestone === 50 ? '🚀' : '🎯'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>{percent.toFixed(1)}% completato</span>
                                    {isCompleted && <span className="text-yellow-400 font-bold">✨ COMPLETATO!</span>}
                                </div>
                            </div>

                            {/* Timeline Prediction */}
                            {!isCompleted && prediction.estimatedCompletionDate && (
                                <div className={`bg-slate-900/50 rounded-lg p-3 mb-3 border ${prediction.onTrack ? 'border-emerald-500/30' : 'border-orange-500/30'}`}>
                                    <div className="flex items-center gap-2 text-xs">
                                        <TrendingUp className={`w-4 h-4 ${prediction.onTrack ? 'text-emerald-400' : 'text-orange-400'}`} />
                                        <span className="text-slate-300">
                                            A questo ritmo raggiungerai l'obiettivo il{' '}
                                            <span className="font-bold text-white">
                                                {new Date(prediction.estimatedCompletionDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Risparmio medio: €{prediction.dailySavingsRate.toFixed(2)}/giorno • {prediction.daysRemaining} giorni rimanenti
                                    </p>
                                </div>
                            )}

                            {/* Quick Add Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onUpdateAmount(goal.id, goal.currentAmount + 50)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition-colors font-medium"
                                >
                                    + €50
                                </button>
                                <button
                                    onClick={() => onUpdateAmount(goal.id, goal.currentAmount + 100)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition-colors font-medium"
                                >
                                    + €100
                                </button>
                                <button
                                    onClick={() => onUpdateAmount(goal.id, goal.currentAmount + 500)}
                                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs py-2 rounded-lg transition-colors font-medium"
                                >
                                    + €500
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