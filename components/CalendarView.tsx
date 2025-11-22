import React, { useMemo, useState } from 'react';
import { Loan, Subscription, Invoice } from '../types';
import { CalendarDays, AlertCircle, CheckCircle, Clock } from './Icons';

interface CalendarViewProps {
  loans: Loan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
}

interface CalendarEvent {
    date: string; // YYYY-MM-DD
    type: 'loan' | 'subscription' | 'invoice_in' | 'invoice_out';
    title: string;
    amount: number;
    id: string;
    completed: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ loans, subscriptions, invoices }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const events = useMemo(() => {
      const evts: CalendarEvent[] = [];
      
      // 1. Loans
      loans.forEach(l => {
          if (l.nextPaymentDate && l.remainingAmount > 0) {
              evts.push({
                  date: l.nextPaymentDate.split('T')[0],
                  type: 'loan',
                  title: `Rata: ${l.name}`,
                  amount: l.monthlyPayment,
                  id: l.id,
                  completed: false
              });
          }
      });

      // 2. Subscriptions
      subscriptions.forEach(s => {
          if (s.active && s.nextPaymentDate) {
              evts.push({
                  date: s.nextPaymentDate.split('T')[0],
                  type: 'subscription',
                  title: s.name,
                  amount: s.cost,
                  id: s.id,
                  completed: false
              });
          }
      });

      // 3. Invoices
      invoices.forEach(i => {
          if (i.status !== 'paid') {
              evts.push({
                  date: i.dueDate.split('T')[0],
                  type: i.type === 'issued' ? 'invoice_in' : 'invoice_out',
                  title: `Ft. ${i.number} - ${i.entityName}`,
                  amount: i.amount,
                  id: i.id,
                  completed: false
              });
          }
      });

      return evts;
  }, [loans, subscriptions, invoices]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Sun, 1 = Mon...
  // Adjust so Monday is 0
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startOffset }, (_, i) => i);

  const changeMonth = (delta: number) => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + delta);
      setCurrentMonth(newDate);
  };

  const getEventsForDay = (day: number) => {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return events.filter(e => e.date === dateStr);
  };

  const getEventColor = (type: string) => {
      switch(type) {
          case 'loan': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
          case 'subscription': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
          case 'invoice_in': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; // Credit
          case 'invoice_out': return 'bg-rose-500/20 text-rose-300 border-rose-500/30'; // Debt
          default: return 'bg-slate-700 text-slate-300';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-3">
             <CalendarDays className="w-6 h-6 text-blue-400" />
             <h2 className="text-xl font-bold text-white capitalize">
                 {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
             </h2>
          </div>
          <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">Indietro</button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">Avanti</button>
          </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
              <div key={d} className="text-center text-sm font-bold text-slate-500 py-2">{d}</div>
          ))}

          {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="bg-slate-800/30 rounded-xl min-h-[100px]"></div>
          ))}

          {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = 
                day === new Date().getDate() && 
                currentMonth.getMonth() === new Date().getMonth() && 
                currentMonth.getFullYear() === new Date().getFullYear();

              return (
                  <div key={day} className={`bg-slate-800 border ${isToday ? 'border-blue-500 shadow-lg shadow-blue-900/20' : 'border-slate-700'} rounded-xl min-h-[120px] p-2 flex flex-col gap-1 hover:border-slate-500 transition-colors relative`}>
                      <span className={`text-sm font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-white' : 'text-slate-400'}`}>
                          {day}
                      </span>
                      
                      <div className="flex flex-col gap-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                        {dayEvents.map(ev => (
                            <div key={`${ev.type}-${ev.id}`} className={`text-[10px] p-1.5 rounded border ${getEventColor(ev.type)} truncate`}>
                                <div className="flex justify-between">
                                    <span className="truncate font-medium">{ev.title}</span>
                                </div>
                                <div className="font-bold">€ {ev.amount.toLocaleString()}</div>
                            </div>
                        ))}
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default CalendarView;