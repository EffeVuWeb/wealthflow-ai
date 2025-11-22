import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Transaction, FinancialSummary, Loan, Account, Subscription, Invoice, Investment, Debt } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Send, Bot } from './Icons';

interface CoachViewProps {
  transactions: Transaction[];
  summary: FinancialSummary;
  loans: Loan[];
  accounts: Account[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  investments: Investment[];
  debts: Debt[];
}

const CoachView: React.FC<CoachViewProps> = ({ transactions, summary, loans, accounts, subscriptions, invoices, investments, debts }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Ciao! Sono il tuo Coach Finanziario. Posso analizzare i tuoi conti, le tue carte e i tuoi investimenti. Come posso aiutarti oggi?",
      timestamp: Date.now(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getFinancialAdvice(userMsg.text, transactions, summary, loans, accounts, subscriptions, invoices, investments, debts);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
          <Bot className="text-white w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white">WealthFlow Coach</h3>
          <p className="text-xs text-slate-400">Powered by Gemini 2.5</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-100 rounded-bl-none border border-slate-600'
              }`}
            >
              {msg.text.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0 min-h-[1.2em]">{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl px-4 py-3 rounded-bl-none border border-slate-600 flex gap-1 items-center">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:border-violet-500 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Chiedimi un consiglio..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none px-2"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isLoading 
                ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachView;