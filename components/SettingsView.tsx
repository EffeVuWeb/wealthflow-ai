import React, { useRef, useState, useEffect } from 'react';
import { Settings, Download, Upload, FileJson, CheckCircle, AlertCircle, Trash2, Lock, Unlock } from './Icons';
import { ToastType } from '../types';

interface SettingsViewProps {
    onImport: (data: any) => void;
    addToast: (msg: string, type: ToastType) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onImport, addToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [hasPin, setHasPin] = useState(false);
    const [newPin, setNewPin] = useState('');

    useEffect(() => {
        setHasPin(!!localStorage.getItem('wf_security_pin'));
    }, []);

    const handleExport = () => {
        const data = {
            transactions: JSON.parse(localStorage.getItem('wf_transactions') || '[]'),
            loans: JSON.parse(localStorage.getItem('wf_loans') || '[]'),
            accounts: JSON.parse(localStorage.getItem('wf_accounts') || '[]'),
            budgets: JSON.parse(localStorage.getItem('wf_budgets') || '[]'),
            goals: JSON.parse(localStorage.getItem('wf_goals') || '[]'),
            subscriptions: JSON.parse(localStorage.getItem('wf_subscriptions') || '[]'),
            invoices: JSON.parse(localStorage.getItem('wf_invoices') || '[]'),
            investments: JSON.parse(localStorage.getItem('wf_investments') || '[]'),
            recurringRules: JSON.parse(localStorage.getItem('wf_recurring') || '[]'),
            exportDate: new Date().toISOString(),
            version: '1.2'
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `wealthflow_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        addToast("Backup esportato con successo!", "success");
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);
                
                // Basic Validation
                if (!parsedData.transactions || !parsedData.accounts) {
                    throw new Error("Invalid file format");
                }

                onImport(parsedData);
                addToast("Dati importati correttamente!", "success");
            } catch (err) {
                console.error(err);
                addToast("Errore nel file di backup.", "error");
            }
        };
        reader.readAsText(file);
    };

    const handleClearAll = () => {
        if(window.confirm("SEI SICURO? Questo cancellerà TUTTI i tuoi dati dal browser. Questa azione è irreversibile.")) {
            localStorage.clear();
            window.location.reload();
        }
    }

    const handleSetPin = () => {
        if (newPin.length === 4) {
            localStorage.setItem('wf_security_pin', newPin);
            setHasPin(true);
            setNewPin('');
            addToast("PIN impostato! Al prossimo avvio sarà richiesto.", "success");
        } else {
            addToast("Il PIN deve essere di 4 cifre.", "error");
        }
    };

    const handleRemovePin = () => {
        if(window.confirm("Vuoi rimuovere il blocco PIN?")) {
            localStorage.removeItem('wf_security_pin');
            setHasPin(false);
            addToast("PIN rimosso.", "info");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
                <div className="p-4 bg-slate-900 rounded-full border border-slate-700 shadow-xl">
                    <Settings className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Impostazioni & Backup</h2>
                    <p className="text-slate-400 text-sm">Gestisci i tuoi dati in sicurezza. I dati sono salvati solo nel tuo browser.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-colors group">
                    <div className="mb-4 bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Esporta Backup (JSON)</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Scarica un file completo con tutti i tuoi dati (transazioni, conti, impostazioni). 
                        Consigliato farlo una volta al mese.
                    </p>
                    <button 
                        onClick={handleExport}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <FileJson className="w-5 h-5" /> Scarica Dati
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors group">
                    <div className="mb-4 bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Ripristina Backup</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Carica un file JSON precedentemente esportato. 
                        <span className="text-rose-400 font-bold"> Attenzione: sovrascriverà i dati attuali!</span>
                    </p>
                    
                    <div className="relative">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".json"
                            className="hidden"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-600"
                        >
                            <Upload className="w-5 h-5" /> Carica File
                        </button>
                    </div>
                </div>
            </div>

             {/* Security Section */}
             <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                        {hasPin ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Sicurezza App</h3>
                        <p className="text-sm text-slate-400">Imposta un PIN per proteggere l'accesso.</p>
                    </div>
                </div>

                {hasPin ? (
                    <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <span className="text-emerald-400 font-bold text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> App Protetta da PIN</span>
                        <button onClick={handleRemovePin} className="text-xs text-rose-400 hover:text-rose-300 font-bold underline">Rimuovi Blocco</button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <input 
                            type="password" 
                            maxLength={4}
                            placeholder="PIN (4 cifre)" 
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 text-white w-40 text-center tracking-widest"
                        />
                        <button 
                            onClick={handleSetPin}
                            disabled={newPin.length !== 4}
                            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Imposta PIN
                        </button>
                    </div>
                )}
             </div>

             {/* Danger Zone */}
             <div className="mt-8 border border-rose-900/30 bg-rose-900/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="text-rose-500 w-6 h-6" />
                    <h3 className="text-lg font-bold text-rose-500">Zona Pericolosa</h3>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-rose-200/70">Cancellare tutti i dati dell'applicazione in modo permanente.</p>
                    <button 
                        onClick={handleClearAll}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Reset Totale
                    </button>
                </div>
             </div>
        </div>
    );
};

export default SettingsView;