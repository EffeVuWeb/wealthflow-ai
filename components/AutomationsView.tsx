import React, { useState } from 'react';
import { AutomationRule, AutomationTriggerType, AutomationActionType, Account } from '../types';
import { Zap, Plus, Trash2, Check, X, ChevronDown, ChevronUp } from './Icons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';

interface AutomationsViewProps {
    rules: AutomationRule[];
    accounts: Account[];
    onAddRule: (rule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>) => void;
    onDeleteRule: (id: string) => void;
    onToggleRule: (id: string) => void;
}

const AutomationsView: React.FC<AutomationsViewProps> = ({ rules, accounts, onAddRule, onDeleteRule, onToggleRule }) => {
    const [showForm, setShowForm] = useState(false);
    const [expandedRule, setExpandedRule] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState<AutomationTriggerType>('transaction_received');
    const [actionType, setActionType] = useState<AutomationActionType>('send_notification');

    // Trigger conditions
    const [accountId, setAccountId] = useState('');
    const [category, setCategory] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [descriptionContains, setDescriptionContains] = useState('');
    const [balanceThreshold, setBalanceThreshold] = useState('');
    const [categoryLimit, setCategoryLimit] = useState('');

    // Action params
    const [invoiceAmount, setInvoiceAmount] = useState('');
    const [invoiceDescription, setInvoiceDescription] = useState('');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationBody, setNotificationBody] = useState('');
    const [tag, setTag] = useState('');

    const resetForm = () => {
        setName('');
        setDescription('');
        setTriggerType('transaction_received');
        setActionType('send_notification');
        setAccountId('');
        setCategory('');
        setAmountMin('');
        setAmountMax('');
        setDescriptionContains('');
        setBalanceThreshold('');
        setCategoryLimit('');
        setInvoiceAmount('');
        setInvoiceDescription('');
        setNotificationTitle('');
        setNotificationBody('');
        setTag('');
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Inserisci un nome per la regola');
            return;
        }

        const newRule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'> = {
            name,
            description,
            active: true,
            trigger: {
                type: triggerType,
                conditions: {
                    ...(accountId && { accountId }),
                    ...(category && { category }),
                    ...(amountMin && { amountMin: parseFloat(amountMin) }),
                    ...(amountMax && { amountMax: parseFloat(amountMax) }),
                    ...(descriptionContains && { descriptionContains }),
                    ...(balanceThreshold && { balanceThreshold: parseFloat(balanceThreshold) }),
                    ...(categoryLimit && { categoryLimit: parseFloat(categoryLimit) })
                }
            },
            action: {
                type: actionType,
                params: {
                    ...(invoiceAmount && { invoiceAmount: parseFloat(invoiceAmount) }),
                    ...(invoiceDescription && { invoiceDescription }),
                    ...(notificationTitle && { notificationTitle }),
                    ...(notificationBody && { notificationBody }),
                    ...(tag && { tag })
                }
            },
            lastTriggered: undefined
        };

        onAddRule(newRule);
        resetForm();
        setShowForm(false);
    };

    const getTriggerLabel = (type: AutomationTriggerType) => {
        switch (type) {
            case 'transaction_received': return '📥 Nuova Transazione';
            case 'balance_below': return '💰 Saldo Sotto Soglia';
            case 'category_exceeds': return '📊 Categoria Supera Limite';
        }
    };

    const getActionLabel = (type: AutomationActionType) => {
        switch (type) {
            case 'create_invoice': return '📄 Crea Fattura';
            case 'send_notification': return '🔔 Invia Notifica';
            case 'add_tag': return '🏷️ Aggiungi Tag';
        }
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-900/40 to-slate-900 border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Zap className="w-8 h-8 text-amber-400" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Automazioni Avanzate</h2>
                            <p className="text-slate-400 text-sm">Crea regole intelligenti per automatizzare azioni.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" /> Nuova Regola
                    </button>
                </div>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Crea Nuova Automazione</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Nome Regola</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                placeholder="Es: Auto-fattura da Cliente X"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Descrizione</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                placeholder="Breve descrizione"
                            />
                        </div>
                    </div>

                    {/* Trigger Section */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="text-white font-bold mb-3">🎯 Quando (Trigger)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">Tipo Trigger</label>
                                <select
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                >
                                    <option value="transaction_received">Nuova Transazione</option>
                                    <option value="balance_below">Saldo Sotto Soglia</option>
                                    <option value="category_exceeds">Categoria Supera Limite</option>
                                </select>
                            </div>

                            {triggerType === 'transaction_received' && (
                                <>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Conto (opzionale)</label>
                                        <select
                                            value={accountId}
                                            onChange={(e) => setAccountId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="">Tutti i conti</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Categoria (opzionale)</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="">Tutte</option>
                                            <optgroup label="Entrate">{INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                                            <optgroup label="Spese">{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Importo Min (€)</label>
                                        <input type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Importo Max (€)</label>
                                        <input type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="Illimitato" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm text-slate-400 mb-1 block">Descrizione Contiene</label>
                                        <input type="text" value={descriptionContains} onChange={(e) => setDescriptionContains(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="Es: Cliente ABC" />
                                    </div>
                                </>
                            )}

                            {triggerType === 'balance_below' && (
                                <>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Conto</label>
                                        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                                            <option value="">Seleziona conto</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Soglia (€)</label>
                                        <input type="number" value={balanceThreshold} onChange={(e) => setBalanceThreshold(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="500" />
                                    </div>
                                </>
                            )}

                            {triggerType === 'category_exceeds' && (
                                <>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Categoria</label>
                                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                                            <option value="">Seleziona</option>
                                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Limite Mensile (€)</label>
                                        <input type="number" value={categoryLimit} onChange={(e) => setCategoryLimit(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="200" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="text-white font-bold mb-3">⚡ Allora (Azione)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">Tipo Azione</label>
                                <select value={actionType} onChange={(e) => setActionType(e.target.value as AutomationActionType)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white">
                                    <option value="send_notification">Invia Notifica</option>
                                    <option value="create_invoice">Crea Fattura</option>
                                    <option value="add_tag">Aggiungi Tag</option>
                                </select>
                            </div>

                            {actionType === 'create_invoice' && (
                                <>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Importo Fattura (€)</label>
                                        <input type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="100" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm text-slate-400 mb-1 block">Descrizione Fattura</label>
                                        <input type="text" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="Servizio reso" />
                                    </div>
                                </>
                            )}

                            {actionType === 'send_notification' && (
                                <>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">Titolo Notifica</label>
                                        <input type="text" value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="Automazione Attivata" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm text-slate-400 mb-1 block">Messaggio</label>
                                        <input type="text" value={notificationBody} onChange={(e) => setNotificationBody(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="La regola è stata eseguita" />
                                    </div>
                                </>
                            )}

                            {actionType === 'add_tag' && (
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Tag</label>
                                    <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="auto-generated" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                            Crea Regola
                        </button>
                        <button onClick={() => { resetForm(); setShowForm(false); }} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                            Annulla
                        </button>
                    </div>
                </div>
            )}

            {/* Rules List */}
            <div className="space-y-4">
                {rules.length === 0 ? (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
                        <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Nessuna automazione creata. Clicca "Nuova Regola" per iniziare!</p>
                    </div>
                ) : (
                    rules.map(rule => (
                        <div key={rule.id} className={`bg-slate-800/50 border rounded-2xl p-4 transition-all ${rule.active ? 'border-amber-500/30' : 'border-slate-700'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <button onClick={() => onToggleRule(rule.id)} className={`p-2 rounded-lg transition-colors ${rule.active ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-500'}`}>
                                        {rule.active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                    </button>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold">{rule.name}</h3>
                                        <p className="text-sm text-slate-400">{rule.description || 'Nessuna descrizione'}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{getTriggerLabel(rule.trigger.type)}</span>
                                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">{getActionLabel(rule.action.type)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {rule.triggerCount > 0 && <span className="text-xs text-slate-500">Eseguita {rule.triggerCount}x</span>}
                                    <button onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)} className="p-2 text-slate-400 hover:text-white">
                                        {expandedRule === rule.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => onDeleteRule(rule.id)} className="p-2 text-rose-400 hover:text-rose-300">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {expandedRule === rule.id && (
                                <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-300 space-y-2">
                                    <p><strong>Trigger:</strong> {JSON.stringify(rule.trigger.conditions, null, 2)}</p>
                                    <p><strong>Azione:</strong> {JSON.stringify(rule.action.params, null, 2)}</p>
                                    {rule.lastTriggered && <p><strong>Ultima esecuzione:</strong> {new Date(rule.lastTriggered).toLocaleString()}</p>}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AutomationsView;
