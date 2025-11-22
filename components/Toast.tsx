import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from './Icons';
import { ToastType } from '../types';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000); // Auto hide after 5 seconds
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return 'border-emerald-500/30 bg-emerald-900/20';
      case 'error': return 'border-rose-500/30 bg-rose-900/20';
      case 'warning': return 'border-amber-500/30 bg-amber-900/20';
      default: return 'border-blue-500/30 bg-blue-900/20';
    }
  };

  return (
    <div className={`flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-xl border shadow-xl backdrop-blur-md animate-in slide-in-from-right-full duration-300 ${getColors()}`}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 text-sm text-white font-medium">{message}</div>
      <button onClick={() => onClose(id)} className="text-slate-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;