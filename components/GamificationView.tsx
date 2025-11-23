import React from 'react';
import { Badge } from '../types';
import {
    Footprints,
    TrendingUp,
    PiggyBank,
    Sprout,
    Unlock,
    Gem,
    PieChart,
    Target,
    Lock,
    Trophy
} from 'lucide-react';

interface GamificationViewProps {
    badges: Badge[];
}

const GamificationView: React.FC<GamificationViewProps> = ({ badges }) => {
    const unlockedCount = badges.filter(b => b.unlocked).length;
    const totalCount = badges.length;
    const progressPercentage = (unlockedCount / totalCount) * 100;

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Footprints': return <Footprints className="w-8 h-8" />;
            case 'TrendingUp': return <TrendingUp className="w-8 h-8" />;
            case 'PiggyBank': return <PiggyBank className="w-8 h-8" />;
            case 'Sprout': return <Sprout className="w-8 h-8" />;
            case 'Unlock': return <Unlock className="w-8 h-8" />;
            case 'Gem': return <Gem className="w-8 h-8" />;
            case 'PieChart': return <PieChart className="w-8 h-8" />;
            case 'Target': return <Target className="w-8 h-8" />;
            default: return <Trophy className="w-8 h-8" />;
        }
    };

    const getColorClass = (color: string, unlocked: boolean) => {
        if (!unlocked) return 'bg-slate-800 text-slate-600 border-slate-700';
        switch (color) {
            case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
            case 'emerald': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
            case 'amber': return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
            case 'indigo': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]';
            case 'cyan': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]';
            case 'violet': return 'bg-violet-500/20 text-violet-400 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]';
            case 'fuchsia': return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]';
            case 'rose': return 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
            default: return 'bg-slate-700 text-white';
        }
    };

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        Obiettivi & Badge
                    </h2>
                    <p className="text-slate-400 mb-6">Sblocca i badge raggiungendo i tuoi obiettivi finanziari.</p>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <span className="text-white font-bold whitespace-nowrap">{unlockedCount} / {totalCount} Sbloccati</span>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {badges.map(badge => (
                    <div
                        key={badge.id}
                        className={`relative p-6 rounded-2xl border transition-all duration-300 group hover:scale-[1.02] ${getColorClass(badge.color, badge.unlocked)}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${badge.unlocked ? 'bg-white/10' : 'bg-slate-900/50'}`}>
                                {getIcon(badge.icon)}
                            </div>
                            {!badge.unlocked && <Lock className="w-5 h-5 text-slate-600" />}
                        </div>

                        <h3 className={`text-xl font-bold mb-2 ${badge.unlocked ? 'text-white' : 'text-slate-500'}`}>
                            {badge.name}
                        </h3>
                        <p className={`text-sm mb-4 ${badge.unlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                            {badge.description}
                        </p>

                        {/* Progress Bar for Locked Badges */}
                        {badge.progress !== undefined && (
                            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${badge.unlocked ? 'bg-white/50' : 'bg-slate-600'}`}
                                    style={{ width: `${badge.progress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GamificationView;
