import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, List, TrendingUp, Calendar, Settings } from 'lucide-react';

interface BottomNavigationProps {
    activeView: AppView;
    onNavigate: (view: AppView) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeView, onNavigate }) => {
    const navItems = [
        { view: AppView.DASHBOARD, icon: LayoutDashboard, label: 'Home' },
        { view: AppView.TRANSACTIONS, icon: List, label: 'Transazioni' },
        { view: AppView.FORECAST, icon: TrendingUp, label: 'Forecast' },
        { view: AppView.CALENDAR, icon: Calendar, label: 'Calendario' },
        { view: AppView.SETTINGS, icon: Settings, label: 'Altro' }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-bottom">
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map(({ view, icon: Icon, label }) => (
                    <button
                        key={view}
                        onClick={() => onNavigate(view)}
                        className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${activeView === view
                            ? 'text-blue-400 bg-blue-500/10'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default BottomNavigation;
