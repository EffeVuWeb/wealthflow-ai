import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Info } from './Icons';
import { SmartAlert } from '../services/predictionService';

interface SmartAlertsProps {
    alerts: SmartAlert[];
    maxVisible?: number;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ alerts, maxVisible = 3 }) => {
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    // Load dismissed alerts from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('wf_dismissed_alerts');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Filter out alerts older than 24 hours
                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const valid = Object.entries(parsed)
                    .filter(([_, timestamp]) => (timestamp as number) > oneDayAgo)
                    .map(([id]) => id);
                setDismissedAlerts(new Set(valid));
            } catch (e) {
                console.error('Error loading dismissed alerts:', e);
            }
        }
    }, []);

    const handleDismiss = (alertId: string) => {
        const newDismissed = new Set(dismissedAlerts);
        newDismissed.add(alertId);
        setDismissedAlerts(newDismissed);

        // Save to localStorage with timestamp
        const stored = localStorage.getItem('wf_dismissed_alerts');
        const dismissedData = stored ? JSON.parse(stored) : {};
        dismissedData[alertId] = Date.now();
        localStorage.setItem('wf_dismissed_alerts', JSON.stringify(dismissedData));
    };

    // Filter out dismissed alerts
    const visibleAlerts = alerts
        .filter(alert => !dismissedAlerts.has(alert.id))
        .slice(0, maxVisible);

    if (visibleAlerts.length === 0) return null;

    const getAlertStyles = (type: SmartAlert['type']) => {
        switch (type) {
            case 'critical':
                return {
                    bg: 'bg-rose-900/40',
                    border: 'border-rose-500/50',
                    icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
                    iconBg: 'bg-rose-500/20'
                };
            case 'warning':
                return {
                    bg: 'bg-orange-900/40',
                    border: 'border-orange-500/50',
                    icon: <AlertCircle className="w-5 h-5 text-orange-400" />,
                    iconBg: 'bg-orange-500/20'
                };
            case 'info':
                return {
                    bg: 'bg-blue-900/40',
                    border: 'border-blue-500/50',
                    icon: <Info className="w-5 h-5 text-blue-400" />,
                    iconBg: 'bg-blue-500/20'
                };
        }
    };

    return (
        <div className="space-y-3 mb-6">
            {visibleAlerts.map(alert => {
                const styles = getAlertStyles(alert.type);

                return (
                    <div
                        key={alert.id}
                        className={`${styles.bg} border ${styles.border} rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2`}
                    >
                        <div className={`${styles.iconBg} p-2 rounded-lg flex-shrink-0`}>
                            {styles.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm mb-1">{alert.title}</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">{alert.message}</p>

                            {alert.action && (
                                <button
                                    onClick={alert.action.callback}
                                    className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 underline"
                                >
                                    {alert.action.label}
                                </button>
                            )}
                        </div>

                        {alert.dismissible && (
                            <button
                                onClick={() => handleDismiss(alert.id)}
                                className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                                title="Nascondi per 24 ore"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );
            })}

            {alerts.length > maxVisible && (
                <p className="text-center text-xs text-slate-500">
                    +{alerts.length - maxVisible} altri avvisi
                </p>
            )}
        </div>
    );
};

export default SmartAlerts;
