import React, { useRef, useState, useEffect } from 'react';
import { Settings, Download, Upload, FileJson, CheckCircle, AlertCircle, Trash2, Lock, Unlock, Bell, BellOff } from './Icons';
import { ToastType } from '../types';
import { getNotificationConfig, saveNotificationConfig, requestNotificationPermission, checkNotificationPermission, NotificationConfig } from '../services/notificationService';

interface SettingsViewProps {
    onImport: (data: any) => void;
    addToast: (msg: string, type: ToastType) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onImport, addToast }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [hasPin, setHasPin] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(getNotificationConfig());
    const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>(checkNotificationPermission());
    const [darkMode, setDarkMode] = useState(localStorage.getItem('wf_dark_mode') !== 'false');

    useEffect(() => {
        setHasPin(!!localStorage.getItem('wf_security_pin'));
        // Apply dark mode class to document
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

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
        if (window.confirm("SEI SICURO? Questo cancellerà TUTTI i tuoi dati dal browser. Questa azione è irreversibile.")) {
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
        if (window.confirm("Vuoi rimuovere il blocco PIN?")) {
            localStorage.removeItem('wf_security_pin');
            setHasPin(false);
            addToast("PIN rimosso.", "info");
        }
    };

    const handleToggleNotifications = async () => {
        if (!notificationConfig.enabled) {
            const granted = await requestNotificationPermission();
            if (granted) {
                const newConfig = { ...notificationConfig, enabled: true };
                setNotificationConfig(newConfig);
                saveNotificationConfig(newConfig);
                setNotificationPermission('granted');
                addToast("Notifiche attivate!", "success");
            } else {
                addToast("Permesso notifiche negato", "error");
            }
        } else {
            const newConfig = { ...notificationConfig, enabled: false };
            setNotificationConfig(newConfig);
            saveNotificationConfig(newConfig);
            addToast("Notifiche disattivate", "info");
        }
    };

    const handleToggleNotificationType = (type: keyof Omit<NotificationConfig, 'enabled'>) => {
        const newConfig = { ...notificationConfig, [type]: !notificationConfig[type] };
        setNotificationConfig(newConfig);
        saveNotificationConfig(newConfig);
    };

    const handleToggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('wf_dark_mode', String(newMode));
        addToast(`Modalità ${newMode ? 'scura' : 'chiara'} attivata`, "info");
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

            {/* Dark Mode Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {darkMode ? '🌙' : '☀️'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Tema Scuro</h3>
                            <p className="text-sm text-slate-400">Attiva/disattiva la modalità scura</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleDarkMode}
                        className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-slate-600'
                            }`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${notificationConfig.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                        {notificationConfig.enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Notifiche Browser</h3>
                        <p className="text-sm text-slate-400">Ricevi avvisi per scadenze e budget.</p>
                    </div>
                    <button
                        onClick={handleToggleNotifications}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${notificationConfig.enabled
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                    >
                        {notificationConfig.enabled ? 'Attive' : 'Disattivate'}
                    </button>
                </div>

                {notificationPermission === 'denied' && (
                    <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                        <p className="text-xs text-rose-300">⚠️ Permesso notifiche negato. Abilitalo nelle impostazioni del browser.</p>
                    </div>
                )}

                {notificationConfig.enabled && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">📄 Scadenze Fatture (3 giorni)</span>
                            <button
                                onClick={() => handleToggleNotificationType('invoiceDeadlines')}
                                className={`w-12 h-6 rounded-full transition-colors ${notificationConfig.invoiceDeadlines ? 'bg-blue-600' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationConfig.invoiceDeadlines ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">💰 Avvisi Budget Superato</span>
                            <button
                                onClick={() => handleToggleNotificationType('budgetAlerts')}
                                className={`w-12 h-6 rounded-full transition-colors ${notificationConfig.budgetAlerts ? 'bg-blue-600' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationConfig.budgetAlerts ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">🔄 Rinnovi Abbonamenti (1 giorno)</span>
                            <button
                                onClick={() => handleToggleNotificationType('subscriptionRenewals')}
                                className={`w-12 h-6 rounded-full transition-colors ${notificationConfig.subscriptionRenewals ? 'bg-blue-600' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationConfig.subscriptionRenewals ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">🏦 Rate Prestiti (3 giorni)</span>
                            <button
                                onClick={() => handleToggleNotificationType('loanPayments')}
                                className={`w-12 h-6 rounded-full transition-colors ${notificationConfig.loanPayments ? 'bg-blue-600' : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationConfig.loanPayments ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    </div>
                )}
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