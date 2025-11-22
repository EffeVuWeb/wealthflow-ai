import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Info } from './Icons';
import Tooltip from './Tooltip';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'balance' | 'income' | 'expense';
  infoText?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, type, infoText }) => {
  const getColors = () => {
    switch (type) {
      case 'income': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'expense': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'income': return <TrendingUp className="w-6 h-6" />;
      case 'expense': return <TrendingDown className="w-6 h-6" />;
      default: return <Wallet className="w-6 h-6" />;
    }
  };

  const colorClass = getColors();

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-md ${colorClass} transition-all duration-300 hover:scale-105 relative group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium opacity-80">{title}</span>
            {infoText && (
                <Tooltip content={infoText}>
                    <Info className="w-4 h-4 opacity-50 hover:opacity-100 cursor-help" />
                </Tooltip>
            )}
        </div>
        <div className={`p-2 rounded-full ${type === 'income' ? 'bg-emerald-400/20' : type === 'expense' ? 'bg-rose-400/20' : 'bg-blue-400/20'}`}>
          {getIcon()}
        </div>
      </div>
      <h3 className="text-3xl font-bold">
        € {amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h3>
    </div>
  );
};

export default SummaryCard;