import React, { useState, useMemo } from 'react';
import { Transaction, Invoice, Account, ToastType } from '../types';
import { Briefcase, Percent, TrendingUp, TrendingDown, FileText, Calculator, Wallet, Clock, Receipt, Calendar, AlertCircle, CheckCircle, ShieldCheck, Building, Users, ChevronDown, ChevronUp, CreditCard, BarChart as BarChartIcon, Check } from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface TaxesViewProps {
  transactions: Transaction[];
  invoices?: Invoice[];
  accounts: Account[];
  onAddTransaction: (tx: any) => void;
  addToast: (msg: string, type: ToastType) => void;
}

interface TaxDeadline {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'major' | 'minor';
    totalAmount: number;
    codes: { code: string; desc: string; amount: number; section: 'Erario' | 'INPS' }[];
}

const TaxesView: React.FC<TaxesViewProps> = ({ transactions, invoices = [], accounts, onAddTransaction, addToast }) => {
  // Configuration State
  const [isStartup, setIsStartup] = useState<boolean>(() => {
      return localStorage.getItem('wf_tax_startup') === 'true';
  });
  
  const [coefficient, setCoefficient] = useState<number>(() => {
      const saved = localStorage.getItem('wf_tax_coefficient');
      return saved ? parseFloat(saved) : 78; // Default 78% for Web Design
  });

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Expanded state for deadlines
  const [expandedDeadline, setExpandedDeadline] = useState<number | null>(null);

  // Payment Modal State
  const [payingDeadline, setPayingDeadline] = useState<TaxDeadline | null>(null);
  const [paymentAccount, setPaymentAccount] = useState(accounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleConfigChange = (startup: boolean, coeff: number) => {
      setIsStartup(startup);
      setCoefficient(coeff);
      localStorage.setItem('wf_tax_startup', startup.toString());
      localStorage.setItem('wf_tax_coefficient', coeff.toString());
  };

  const taxRate = isStartup ? 5 : 15;
  const inpsRate = 26.07; // Gestione Separata standard

  // Filter Business Transactions for Selected Year
  const businessTransactions = useMemo(() => {
      return transactions.filter(t => t.isBusiness && new Date(t.date).getFullYear() === selectedYear);
  }, [transactions, selectedYear]);

  // Historical Data for Chart
  const historicalData = useMemo(() => {
      const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 4 + i);
      return years.map(year => {
          const yearTxs = transactions.filter(t => t.isBusiness && new Date(t.date).getFullYear() === year);
          const rev = yearTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const inps = yearTxs.filter(t => t.type === 'expense' && t.category === 'Contributi INPS').reduce((sum, t) => sum + t.amount, 0);
          const taxBase = Math.max(0, (rev * (coefficient/100)) - inps);
          const estimatedTax = taxBase * (taxRate/100) + taxBase * (inpsRate/100);
          return { year, Fatturato: rev, Tasse: estimatedTax };
      });
  }, [transactions, coefficient, taxRate, inpsRate]);

  const metrics = useMemo(() => {
      const grossRevenue = businessTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

      const deductibleInps = businessTransactions
          .filter(t => t.type === 'expense' && t.category === 'Contributi INPS')
          .reduce((sum, t) => sum + t.amount, 0);

      const nonDeductibleExpenses = businessTransactions
          .filter(t => t.type === 'expense' && t.category !== 'Contributi INPS')
          .reduce((sum, t) => sum + t.amount, 0);

      const grossTaxableBase = grossRevenue * (coefficient / 100);
      const netTaxableBase = Math.max(0, grossTaxableBase - deductibleInps);

      const taxDue = netTaxableBase * (taxRate / 100);
      const inpsDue = netTaxableBase * (inpsRate / 100);
      const totalTaxes = taxDue + inpsDue;

      const netProfitReal = grossRevenue - deductibleInps - nonDeductibleExpenses - totalTaxes;

      return {
          grossRevenue,
          deductibleInps,
          nonDeductibleExpenses,
          grossTaxableBase,
          netTaxableBase,
          taxDue,
          inpsDue,
          totalTaxes,
          netProfitReal
      };
  }, [businessTransactions, coefficient, taxRate, inpsRate]);

  // Client Analytics
  const topClients = useMemo(() => {
      const clients: Record<string, number> = {};
      businessTransactions
        .filter(t => t.type === 'income')
        .forEach(t => {
            const name = t.description.replace('Incasso Ft.', '').replace('Fattura', '').split('-')[0].trim() || 'Cliente Occasionale';
            clients[name] = (clients[name] || 0) + t.amount;
        });
      return Object.entries(clients)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
  }, [businessTransactions]);

  const upcomingDeadlines = useMemo(() => {
      const year = new Date().getFullYear();
      const today = new Date();
      
      const taxAmount = metrics.taxDue;
      const inpsAmount = metrics.inpsDue;
      const totalAmount = metrics.totalTaxes;

      const deadlines: TaxDeadline[] = [
          { 
              id: 'd1',
              date: `${year}-06-30`, 
              title: "Saldo 2024 + I Acconto 2025",
              description: "La scadenza principale dell'anno. Include il saldo dell'anno scorso e il 40% (o 50%) dell'acconto per l'anno in corso.", 
              type: 'major', 
              totalAmount: totalAmount * 0.4, 
              codes: [
                  { section: 'Erario', code: '1790', desc: 'Imposta Sostitutiva - SALDO', amount: taxAmount * 0.1 }, 
                  { section: 'Erario', code: '1791', desc: 'Imposta Sostitutiva - I ACCONTO', amount: taxAmount * 0.4 },
                  { section: 'INPS', code: 'PXX', desc: 'Contributi Gest. Separata - SALDO', amount: inpsAmount * 0.1 },
                  { section: 'INPS', code: 'PXX', desc: 'Contributi Gest. Separata - I ACCONTO', amount: inpsAmount * 0.4 }
              ]
          },
          { 
              id: 'd2',
              date: `${year}-11-30`, 
              title: "II Acconto 2025",
              description: "Il secondo acconto per l'anno in corso. Corrisponde solitamente al restante 50-60% delle tasse stimate.", 
              type: 'major', 
              totalAmount: totalAmount * 0.6, 
              codes: [
                  { section: 'Erario', code: '1792', desc: 'Imposta Sostitutiva - II ACCONTO', amount: taxAmount * 0.5 },
                  { section: 'INPS', code: 'PXX', desc: 'Contributi Gest. Separata - II ACCONTO', amount: inpsAmount * 0.5 }
              ]
          },
      ];
      
      return deadlines.filter(d => new Date(d.date) >= new Date(today.setDate(today.getDate() - 30)));
  }, [metrics.totalTaxes, metrics.taxDue, metrics.inpsDue]);

  const handleConfirmPayment = () => {
      if (!payingDeadline || !paymentAccount) return;

      // Create main transaction
      onAddTransaction({
          amount: payingDeadline.totalAmount,
          type: 'expense',
          category: 'Tasse',
          description: `Pagamento F24 - ${payingDeadline.title}`,
          date: new Date(paymentDate).toISOString(),
          accountId: paymentAccount,
          isBusiness: true
      });

      setPayingDeadline(null);
      addToast("Pagamento F24 registrato e saldo aggiornato.", "success");
  };

  const limit85k = metrics.grossRevenue / 85000 * 100;

  return (
    <div className="space-y-6 relative">
      {/* Payment Modal Overlay */}
      {payingDeadline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-bold text-white mb-4">Registra Pagamento F24</h3>
                  <p className="text-sm text-slate-400 mb-6">
                      Stai registrando il pagamento per <strong>{payingDeadline.title}</strong> di <strong>€ {payingDeadline.totalAmount.toLocaleString()}</strong>.
                  </p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs text-slate-500 mb-1">Data Pagamento</label>
                          <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                      </div>
                      <div>
                          <label className="block text-xs text-slate-500 mb-1">Addebita su Conto</label>
                          <select value={paymentAccount} onChange={e => setPaymentAccount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
                              {accounts.filter(a => a.type === 'bank').map(a => (
                                  <option key={a.id} value={a.id}>{a.name} (€ {a.balance.toFixed(2)})</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setPayingDeadline(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700">Annulla</button>
                      <button onClick={handleConfirmPayment} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">Conferma</button>
                  </div>
              </div>
          </div>
      )}

      {/* Config & Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <Building className="w-32 h-32 text-white" />
             </div>
             <div className="flex justify-between items-start mb-6 relative z-10">
                 <div>
                     <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                         <Briefcase className="text-blue-400" />
                         Cruscotto Partita IVA
                     </h2>
                     <p className="text-slate-400 text-sm mt-1">Regime Forfettario • Codice Ateco 74.10.21 (Web Design)</p>
                 </div>
                 <div className="flex items-center gap-2">
                     <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-600 text-xs text-white focus:outline-none"
                     >
                         {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                             <option key={y} value={y}>Anno Fiscale {y}</option>
                         ))}
                     </select>
                 </div>
             </div>

             {/* 85k Threshold Monitor */}
             <div className="mb-2 relative z-10">
                 <div className="flex justify-between items-end mb-2">
                     <span className="text-sm font-bold text-white">Soglia Fatturato (Max € 85k)</span>
                     <span className={`text-sm font-bold ${limit85k > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                         {limit85k.toFixed(1)}% Raggiunto
                     </span>
                 </div>
                 <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                     <div 
                        className={`h-full transition-all duration-1000 ${limit85k > 90 ? 'bg-rose-500' : limit85k > 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(limit85k, 100)}%` }}
                     >
                        {limit85k > 100 && <div className="h-full w-full animate-pulse bg-white/30"></div>}
                     </div>
                 </div>
                 <p className="text-xs text-slate-500 mt-1 text-right">
                     Mancano € {(85000 - metrics.grossRevenue).toLocaleString('it-IT', {maximumFractionDigits: 0})} al limite
                 </p>
             </div>
          </div>

          {/* Configuration */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Configurazione
              </h3>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs text-slate-400 mb-1">Tipologia Regime</label>
                      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                          <button 
                            onClick={() => handleConfigChange(true, coefficient)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${isStartup ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                              Start-up (5%)
                          </button>
                          <button 
                            onClick={() => handleConfigChange(false, coefficient)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${!isStartup ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                              Standard (15%)
                          </button>
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs text-slate-400 mb-1">Coefficiente Redditività (%)</label>
                      <div className="flex items-center gap-2">
                          <input 
                             type="number" 
                             value={coefficient}
                             onChange={(e) => handleConfigChange(isStartup, parseFloat(e.target.value))}
                             className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                          />
                          <span className="text-xs text-slate-500 whitespace-nowrap">Web Design = 78%</span>
                      </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Imposta Sost.:</span>
                          <span className="text-white font-bold">{taxRate}%</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-400">INPS Gest. Sep.:</span>
                          <span className="text-white font-bold">{inpsRate}%</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Calculation Engine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Base */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-xs uppercase font-bold">1. Base Imponibile</span>
                <Receipt className="w-4 h-4 text-slate-500" />
              </div>
              <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Fatturato Incassato</span>
                      <span className="text-white font-medium">€ {metrics.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-400">
                      <span>- INPS Versati (Ded.)</span>
                      <span>€ {metrics.deductibleInps.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-600 my-1"></div>
                  <div className="flex justify-between font-bold text-white">
                      <span>Imponibile Netto</span>
                      <span>€ {metrics.netTaxableBase.toLocaleString('it-IT', {maximumFractionDigits: 0})}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">*Calcolato al {coefficient}% meno deduzioni</p>
              </div>
          </div>

          {/* Step 2: Taxes */}
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-300 text-xs uppercase font-bold">2. Calcolo Imposte</span>
                <Calculator className="w-4 h-4 text-blue-400" />
              </div>
              <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Imposta Sost. ({taxRate}%)</span>
                      <span className="text-rose-400 font-medium">€ {metrics.taxDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-300">INPS ({inpsRate}%)</span>
                      <span className="text-rose-400 font-medium">€ {metrics.inpsDue.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-600 my-1"></div>
                  <div className="flex justify-between font-bold text-white text-lg">
                      <span>Totale Tasse</span>
                      <span>€ {metrics.totalTaxes.toLocaleString('it-IT', {maximumFractionDigits: 0})}</span>
                  </div>
                  <p className="text-[10px] text-blue-300/70 mt-1">Da accantonare in vista di Giugno/Nov</p>
              </div>
          </div>

          {/* Step 3: Real Profit */}
          <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-300 text-xs uppercase font-bold">3. Utile Reale</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
               <div className="flex flex-col h-full justify-between">
                   <div>
                        <p className="text-3xl font-bold text-emerald-400">€ {metrics.netProfitReal.toLocaleString('it-IT', {maximumFractionDigits: 0})}</p>
                        <p className="text-xs text-slate-400 mt-1">Cioè che ti rimane in tasca dopo tasse e spese.</p>
                   </div>
                   <div className="mt-2">
                        <div className="w-full bg-slate-700 h-1.5 rounded-full">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${(metrics.netProfitReal / Math.max(metrics.grossRevenue, 1)) * 100}%`}}></div>
                        </div>
                        <p className="text-[10px] text-right text-slate-500 mt-1">Margine Netto: {((metrics.netProfitReal / Math.max(metrics.grossRevenue, 1)) * 100).toFixed(1)}%</p>
                   </div>
               </div>
          </div>
      </div>

      {/* Historical Comparison Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase">
              <BarChartIcon className="w-4 h-4 text-slate-400" /> Confronto Annuale
          </h3>
          <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="year" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(value: number) => `€ ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="Fatturato" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Tasse" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Top Clients */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" /> Migliori Clienti ({selectedYear})
              </h3>
              <div className="space-y-3">
                  {topClients.map(([name, amount], idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                  {idx + 1}
                              </div>
                              <span className="text-white font-medium">{name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="w-24 hidden sm:block">
                                  <div className="w-full bg-slate-700 h-1.5 rounded-full">
                                      <div className="bg-violet-500 h-1.5 rounded-full" style={{width: `${(amount / metrics.grossRevenue) * 100}%`}}></div>
                                  </div>
                              </div>
                              <span className="text-white font-bold min-w-[80px] text-right">€ {amount.toLocaleString()}</span>
                          </div>
                      </div>
                  ))}
                  {topClients.length === 0 && <p className="text-slate-500 text-sm">Nessun dato cliente disponibile per il {selectedYear}.</p>}
              </div>
          </div>

          {/* Right: Deadlines with F24 Details */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" /> Scadenze Fiscali
              </h3>
              <div className="space-y-3">
                  {upcomingDeadlines.map((d, i) => {
                        const daysLeft = Math.ceil((new Date(d.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isExpanded = expandedDeadline === i;

                        return (
                            <div key={i} className={`bg-slate-900 rounded-xl border ${d.type === 'major' ? 'border-slate-600' : 'border-slate-700'} overflow-hidden transition-all`}>
                                {/* Deadline Header */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-bold text-white">{d.title}</p>
                                            <p className="text-xs text-slate-400">{new Date(d.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold ${daysLeft < 30 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {daysLeft}gg mancanti
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{d.description}</p>
                                    
                                    <div className="flex flex-col gap-2">
                                        <p className="text-white font-bold text-sm">Stima: € {d.totalAmount.toLocaleString('it-IT', {maximumFractionDigits: 0})}</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setExpandedDeadline(isExpanded ? null : i)}
                                                className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-700"
                                            >
                                                <FileText className="w-3 h-3" /> {isExpanded ? 'Chiudi' : 'Dettagli F24'}
                                            </button>
                                            <button 
                                                onClick={() => setPayingDeadline(d)}
                                                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <Check className="w-3 h-3" /> Registra Pagamento
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded F24 Details */}
                                {isExpanded && (
                                    <div className="bg-slate-950/50 p-4 border-t border-slate-700 animate-in slide-in-from-top-2">
                                        <h4 className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" /> Codici Tributo
                                        </h4>
                                        
                                        <div className="space-y-2 mb-4">
                                            {d.codes.map((code, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-800 rounded border border-slate-700/50">
                                                    <div>
                                                        <span className="font-bold text-blue-400 mr-2">{code.section}</span>
                                                        <span className="text-slate-300 font-mono bg-slate-700 px-1 rounded">{code.code}</span>
                                                        <span className="text-slate-400 ml-2">{code.desc}</span>
                                                    </div>
                                                    <span className="text-white font-medium">€ {code.amount.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                                            <p className="text-xs text-blue-200">
                                                <strong>Istruzioni:</strong> Usa l'Home Banking o il sito Agenzia Entrate. 
                                                Compila la sezione "Erario" con i codici 17xx e "INPS" con i codici indicati.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                  })}
                  {upcomingDeadlines.length === 0 && (
                      <div className="text-center text-slate-500 text-sm">Nessuna scadenza imminente.</div>
                  )}
              </div>
          </div>
      </div>
      
      {/* Alert Box for Deduction Rule */}
      <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="text-xs text-blue-200/80">
              <strong>Nota Importante Forfettario:</strong> Le spese business (software, viaggi, cene) NON abbattono le tasse. 
              L'unica spesa che riduce l'imponibile sono i <strong>Contributi INPS</strong> versati nell'anno. 
              Assicurati di categorizzare correttamente i pagamenti INPS con la categoria "Contributi INPS".
          </div>
      </div>
    </div>
  );
};

export default TaxesView;