import React, { useState, useEffect, useRef } from 'react';
import { TransactionType, Account } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { X, Wallet, Briefcase, Camera, Sparkles, Loader2 } from 'lucide-react';
import { extractTransactionFromImage } from '../services/geminiService';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: { amount: number; type: TransactionType; category: string; description: string; date: string; accountId: string; isBusiness: boolean }) => void;
  accounts: Account[];
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAdd, accounts }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-select first account if available
  useEffect(() => {
    if (isOpen && accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
    }
  }, [isOpen, accounts, accountId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !accountId) return;

    onAdd({
      amount: parseFloat(amount),
      type,
      category,
      description,
      date: new Date().toISOString(),
      accountId,
      isBusiness
    });
    
    // Reset
    setAmount('');
    setDescription('');
    setCategory('');
    setIsBusiness(false);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsScanning(true);
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const base64 = reader.result as string;
              const result = await extractTransactionFromImage(base64);
              
              if (result) {
                  setAmount(result.amount.toString());
                  setDescription(result.description);
                  setCategory(result.category);
                  setType('expense'); // Assume expense for receipts
                  // Optionally parse date if needed, but default to today is often safer
              } else {
                  alert("Non sono riuscito a leggere lo scontrino. Riprova con una foto più nitida.");
              }
              setIsScanning(false);
          };
      } catch (error) {
          console.error(error);
          setIsScanning(false);
          alert("Errore durante l'analisi dell'immagine.");
      }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const creditCards = accounts.filter(a => a.type === 'credit_card');
  const liquidAccounts = accounts.filter(a => a.type !== 'credit_card');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Nuova Transazione</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AI Scan Button */}
          <div className="mb-4">
              <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-900/20 border border-white/10"
              >
                  {isScanning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Analisi Scontrino in corso...
                      </>
                  ) : (
                      <>
                        <Camera className="w-5 h-5" /> <Sparkles className="w-4 h-4" /> Smart Scan (AI)
                      </>
                  )}
              </button>
              <p className="text-center text-[10px] text-slate-500 mt-2">Carica una foto dello scontrino e lascia compilare i campi all'AI.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Spesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Entrata
            </button>
          </div>

          {/* Business Toggle */}
          <div 
            onClick={() => setIsBusiness(!isBusiness)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isBusiness ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
          >
             <div className={`p-2 rounded-lg ${isBusiness ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                <Briefcase className="w-5 h-5" />
             </div>
             <div className="flex-1">
                 <p className={`text-sm font-bold ${isBusiness ? 'text-white' : 'text-slate-400'}`}>Transazione Business / P.IVA</p>
                 <p className="text-xs text-slate-500">{isBusiness ? (type === 'income' ? 'Fattura Emessa' : 'Spesa Deducibile Aziendale') : 'Spesa Personale'}</p>
             </div>
             <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isBusiness ? 'border-blue-500 bg-blue-500' : 'border-slate-500'}`}>
                 {isBusiness && <div className="w-2 h-2 bg-white rounded-full" />}
             </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Importo {isBusiness ? '(Lordo)' : ''} (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-lg"
              placeholder="0.00"
            />
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
                {type === 'expense' ? 'Paga con / Addebita su' : 'Accredita su'}
            </label>
            <div className="relative">
                <Wallet className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
                >
                    {creditCards.length > 0 && (
                        <optgroup label="Carte di Credito (Addebito Posticipato)">
                            {creditCards.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} - Saldo: € {acc.balance.toFixed(2)}
                                </option>
                            ))}
                        </optgroup>
                    )}
                    <optgroup label="Conti Correnti & Contanti">
                        {liquidAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} - Disp: € {acc.balance.toFixed(2)}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Categoria</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleziona categoria</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Descrizione (Opzionale)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder={isBusiness ? "Es. Fattura n. 42 Cliente X..." : "Es. Cena fuori..."}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-4"
          >
            Salva Transazione
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;