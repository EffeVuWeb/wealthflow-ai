import React from 'react';
import { DashboardWidget } from '../types';
import { X, ArrowUp, ArrowDown, Eye, EyeOff, Layout } from './Icons';

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidget[];
  onToggleVisibility: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  isOpen,
  onClose,
  widgets,
  onToggleVisibility,
  onMoveUp,
  onMoveDown
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Personalizza Dashboard</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {widgets.map((widget, index) => (
                <div key={widget.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between transition-colors hover:border-blue-500/30">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => onToggleVisibility(widget.id)}
                            className={`p-2 rounded-lg transition-colors ${widget.visible ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'}`}
                            title={widget.visible ? 'Nascondi' : 'Mostra'}
                        >
                            {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <span className={`text-sm font-medium ${widget.visible ? 'text-white' : 'text-slate-500'}`}>
                            {widget.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => onMoveUp(index)}
                            disabled={index === 0}
                            className="p-1.5 text-slate-400 hover:bg-slate-700 rounded disabled:opacity-30"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onMoveDown(index)}
                            disabled={index === widgets.length - 1}
                            className="p-1.5 text-slate-400 hover:bg-slate-700 rounded disabled:opacity-30"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-700">
            <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
                Salva Configurazione
            </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizer;