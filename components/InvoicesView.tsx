import React, { useState, useMemo } from 'react';
import { Invoice, Account, ToastType } from '../types';
import { FileText, Plus, Search, CheckCircle, Clock, AlertCircle, Receipt, Stamp, Trash2, X, BarChart as BarChartIcon, Check } from './Icons';
import AddInvoiceModal from './AddInvoiceModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface InvoicesViewProps {
  invoices: Invoice[];
  accounts: Account[];
  onAddInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  onDeleteInvoice: (id: string) => void;
  onMarkAsPaid: (invoice: Invoice, accountId: string, date: string) => void;
  addToast: (msg: string, type: ToastType) => void;
}

const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, accounts, onAddInvoice, onDeleteInvoice, onMarkAsPaid, addToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; invoice: Invoice | null }>({ isOpen: false, invoice: null });
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<'all' | 'issued' | 'received'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const filteredInvoices = invoices
    .filter(inv => (filter === 'all' || inv.type === filter) && new Date(inv.date).getFullYear() === selectedYear)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart Data
  const chartData = useMemo(() => {
      const data: Record<string, { name: string, Emesse: number, Ricevute: number }> = {};
      const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      
      months.forEach((m, i) => {
          data[i] = { name: m, Emesse: 0, Ricevute: 0 };
      });

      invoices.filter(i => new Date(i.date).getFullYear() === selectedYear).forEach(inv => {
          const month = new Date(inv.date).getMonth();
          if (inv.type === 'issued') data[month].Emesse += inv.amount;
          else data[month].Ricevute += inv.amount;
      });

      return Object.values(data);
  }, [invoices, selectedYear]);

  const handlePayClick = (invoice: Invoice) => {
      setPaymentModal({ isOpen: true, invoice });
      // Reset payment account to the first one or keep existing if valid
      const accountExists = accounts.some(a => a.id === selectedAccount);
      if (!accountExists && accounts.length > 0) {
          setSelectedAccount(accounts[0].id);
      }
      setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const confirmPayment = () => {
      if (paymentModal.invoice && selectedAccount && paymentDate) {
          onMarkAsPaid(paymentModal.invoice, selectedAccount, new Date(paymentDate).toISOString());
          setPaymentModal({ isOpen: false, invoice: null });
          addToast(paymentModal.invoice.type === 'issued' ? "Incasso registrato con successo!" : "Pagamento registrato con successo!", "success");
      }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
      const isOverdue = new Date(dueDate) < new Date() && status !== 'paid';
      
      if (status === 'paid') {
          return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md font-bold border border-emerald-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Pagata</span>;
      }
      if (isOverdue) {
          return <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-md font-bold border border-rose-500/30 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Scaduta</span>;
      }
      if (status === 'sent') {
          return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md font-bold border border-blue-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> In attesa</span>;
      }
      return <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md font-bold border border-slate-600">Bozza</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-6 h-6 text-blue-400" />
                Fatture & Documenti
            </h3>
            <p className="text-slate-400 text-sm">Gestisci il ciclo attivo e passivo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            >
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Tutte</button>
                <button onClick={() => setFilter('issued')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'issued' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>Emesse</button>
                <button onClick={() => setFilter('received')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'received' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}>Ricevute</button>
            </div>
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
            <Plus className="w-4 h-4" /> Nuova Fattura
            </button>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
              <BarChartIcon className="w-4 h-4" /> Andamento Mensile {selectedYear}
          </h4>
          <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} formatter={(value: number) => `€ ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="Emesse" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="Ricevute" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* Invoice List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInvoices.map(invoice => (
            <div key={invoice.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-blue-500/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${invoice.type === 'issued' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                            {invoice.type === 'issued' ? <FileText className="w-5 h-5 text-emerald-400" /> : <Receipt className="w-5 h-5 text-rose-400" />}
                        </div>
                        <div>
                            <h4 className="text-white font-bold">Ft. {invoice.number}</h4>
                            <p className="text-xs text-slate-400">{new Date(invoice.date).toLocaleDateString()} • {invoice.entityName}</p>
                        </div>
                    </div>
                    {getStatusBadge(invoice.status, invoice.dueDate)}
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Totale Documento</p>
                        <p className={`text-xl font-bold ${invoice.type === 'issued' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            € {invoice.amount.toLocaleString('it-IT', {minimumFractionDigits: 2})}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {invoice.status !== 'paid' && (
                            <button 
                                onClick={() => handlePayClick(invoice)}
                                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
                                title={invoice.type === 'issued' ? "Registra Incasso" : "Registra Pagamento"}
                            >
                                <Stamp className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={() => onDeleteInvoice(invoice.id)}
                            className="bg-slate-700 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 p-2 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        ))}
        {filteredInvoices.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl">
                <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">Nessuna fattura trovata per i filtri selezionati.</p>
            </div>
        )}
      </div>

      <AddInvoiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddInvoice}
      />

      {/* Payment Modal */}
      {paymentModal.isOpen && paymentModal.invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-bold text-white mb-4">
                    {paymentModal.invoice.type === 'issued' ? 'Registra Incasso' : 'Registra Pagamento'}
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                    Fattura <strong>{paymentModal.invoice.number}</strong> - {paymentModal.invoice.entityName}<br/>
                    Importo: <strong>€ {paymentModal.invoice.amount.toLocaleString()}</strong>
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Data {paymentModal.invoice.type === 'issued' ? 'Incasso' : 'Pagamento'}</label>
                        <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">{paymentModal.invoice.type === 'issued' ? 'Incassa su Conto' : 'Paga con Conto'}</label>
                        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white">
                            {accounts.filter(a => a.type === 'bank' || a.type === 'cash').map(a => (
                                <option key={a.id} value={a.id}>{a.name} (€ {a.balance.toFixed(2)})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={() => setPaymentModal({ isOpen: false, invoice: null })} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700">Annulla</button>
                    <button onClick={confirmPayment} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">Conferma</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesView;