import React, { useState } from 'react';
import { Loan } from '../types';
import { Plus, Trash2, CreditCard, CheckCircle, TrendingDown, AlertCircle, Calendar, Bell, BellRing } from './Icons';
import AddLoanModal from './AddLoanModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface LoansViewProps {
  loans: Loan[];
  onAddLoan: (loan: Omit<Loan, 'id'>) => void;
  onDeleteLoan: (id: string) => void;
  onPayInstallment: (loan: Loan) => void;
}

const COLORS = ['#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4', '#10b981'];

const LoansView: React.FC<LoansViewProps> = ({ loans, onAddLoan, onDeleteLoan, onPayInstallment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalDebt = loans.reduce((acc, loan) => acc + loan.remainingAmount, 0);
  const monthlyCommitment = loans.reduce((acc, loan) => acc + loan.monthlyPayment, 0);

  // Chart Data
  const loanData = loans.filter(l => l.remainingAmount > 0).map(l => ({
      name: l.name,
      value: l.remainingAmount
  }));

  // Calculate upcoming payments
  const upcomingPayments = loans.filter(l => {
      if (!l.nextPaymentDate || l.remainingAmount <= 0) return false;
      const today = new Date();
      const dueDate = new Date(l.nextPaymentDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays >= -5 && diffDays <= 7; // Show if overdue by 5 days or coming in 7 days
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner for Upcoming Payments */}
      {upcomingPayments.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
              <BellRing className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
              <div>
                  <h4 className="font-bold text-orange-400">Scadenze Imminenti</h4>
                  <p className="text-sm text-orange-200/80">Hai {upcomingPayments.length} rate da pagare nei prossimi giorni.</p>
              </div>
          </div>
      )}

      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Debito Totale Residuo</p>
            <h3 className="text-3xl font-bold text-white mt-1">€ {totalDebt.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-rose-500/20 p-3 rounded-full">
            <TrendingDown className="w-8 h-8 text-rose-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium">Impegno Mensile Totale</p>
            <h3 className="text-3xl font-bold text-white mt-1">€ {monthlyCommitment.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-violet-500/20 p-3 rounded-full">
            <CreditCard className="w-8 h-8 text-violet-400" />
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col justify-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 text-center">Ripartizione Debito</h4>
            <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={loanData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                            {loanData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '10px' }} formatter={(value: number) => `€ ${value.toFixed(0)}`} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <h3 className="text-xl font-bold text-white">I tuoi Finanziamenti</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg shadow-violet-900/20"
        >
          <Plus className="w-4 h-4" /> Nuovo Finanziamento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loans.map((loan) => {
          const progress = ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100;
          const isPaidOff = loan.remainingAmount <= 0;
          
          let daysUntilDue = null;
          let isDueSoon = false;
          if (loan.nextPaymentDate) {
             const today = new Date();
             const dueDate = new Date(loan.nextPaymentDate);
             const diffTime = dueDate.getTime() - today.getTime();
             daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             isDueSoon = daysUntilDue <= 7 && daysUntilDue > -30;
          }

          return (
            <div key={loan.id} className={`bg-slate-800/50 border ${isDueSoon && loan.reminderEnabled ? 'border-orange-500/50 shadow-lg shadow-orange-900/10' : 'border-slate-700'} rounded-2xl p-6 hover:bg-slate-800 transition-all relative overflow-hidden`}>
              {/* Reminder Indicator */}
              {isDueSoon && loan.reminderEnabled && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                      SCADENZA VICINA
                  </div>
              )}

              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPaidOff ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                    {isPaidOff ? <CheckCircle className="text-emerald-400" /> : <CreditCard className="text-slate-300" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        {loan.name}
                        {loan.reminderEnabled && <Bell className="w-3 h-3 text-slate-500" />}
                    </h4>
                    <p className="text-slate-400 text-sm flex items-center gap-2 flex-wrap">
                      <span>Rata: <span className="text-white font-medium">€ {loan.monthlyPayment.toFixed(2)}</span></span>
                      {loan.interestRate && <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">TAEG {loan.interestRate}%</span>}
                      {loan.nextPaymentDate && !isPaidOff && (
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${isDueSoon ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-700 text-slate-300'}`}>
                              <Calendar className="w-3 h-3" />
                              {new Date(loan.nextPaymentDate).toLocaleDateString()}
                              {daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0 && ` (tra ${daysUntilDue} gg)`}
                              {daysUntilDue !== null && daysUntilDue < 0 && ` (Scaduta!)`}
                          </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isPaidOff && (
                    <button 
                      onClick={() => onPayInstallment(loan)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-emerald-900/20"
                      title="Registra il pagamento della rata come spesa e riduci il debito"
                    >
                      Paga Rata
                    </button>
                  )}
                  <button 
                    onClick={() => onDeleteLoan(loan.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Pagato: € {(loan.totalAmount - loan.remainingAmount).toLocaleString('it-IT', {maximumFractionDigits: 0})}</span>
                    <span className="text-white font-medium">Residuo: € {loan.remainingAmount.toLocaleString('it-IT', {maximumFractionDigits: 0})}</span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isPaidOff ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-end">
                    <span className="text-xs text-slate-500">{progress.toFixed(1)}% Completato</span>
                </div>
              </div>
            </div>
          );
        })}
        
        {loans.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl">
            <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-slate-500 w-8 h-8" />
            </div>
            <p className="text-slate-400 mb-2">Non hai finanziamenti attivi.</p>
            <p className="text-slate-500 text-sm">Aggiungili per monitorare i tuoi debiti e le rate mensili.</p>
          </div>
        )}
      </div>

      <AddLoanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddLoan}
      />
    </div>
  );
};

export default LoansView;