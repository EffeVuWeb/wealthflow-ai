import React, { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { Investment } from '../types';
import { INVESTMENT_CATEGORIES } from '../constants';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (inv: Omit<Investment, 'id'>) => void;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [category, setCategory] = useState(INVESTMENT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState('');
  const [averageBuyPrice, setAverageBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !currentPrice) return;

    onAdd({
      name,
      symbol: symbol.toUpperCase(),
      category: category as any,
      quantity: parseFloat(quantity),
      averageBuyPrice: averageBuyPrice ? parseFloat(averageBuyPrice) : parseFloat(currentPrice),
      currentPrice: parseFloat(currentPrice),
      lastUpdated: new Date().toISOString()
    });
    
    setName('');
    setSymbol('');
    setQuantity('');
    setAverageBuyPrice('');
    setCurrentPrice('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-violet-400" />
              <h2 className="text-xl font-bold text-white">Nuovo Investimento</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome Asset</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="Es. Bitcoin, Apple, Oro..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-slate-400 mb-1">Simbolo/Ticker</label>
                <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="Es. BTC"
                />
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Categoria</label>
                <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                >
                {INVESTMENT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantità</label>
              <input
                type="number"
                step="0.000001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Prezzo Attuale (€)</label>
              <input
                type="number"
                step="0.01"
                required
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Prezzo Medio Carico (Opz.)</label>
            <input
              type="number"
              step="0.01"
              value={averageBuyPrice}
              onChange={(e) => setAverageBuyPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              placeholder="Se vuoto, usa Prezzo Attuale"
            />
            <p className="text-xs text-slate-500 mt-1">Serve per calcolare il Profit/Loss.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg shadow-violet-900/20"
          >
            Aggiungi al Portfolio
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddInvestmentModal;