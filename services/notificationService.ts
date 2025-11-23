export type NotificationType = 'invoice' | 'budget' | 'subscription' | 'loan';

export interface NotificationConfig {
    enabled: boolean;
    invoiceDeadlines: boolean;
    budgetAlerts: boolean;
    subscriptionRenewals: boolean;
    loanPayments: boolean;
}

const DEFAULT_CONFIG: NotificationConfig = {
    enabled: false,
    invoiceDeadlines: true,
    budgetAlerts: true,
    subscriptionRenewals: true,
    loanPayments: true
};

export const getNotificationConfig = (): NotificationConfig => {
    const stored = localStorage.getItem('wf_notification_config');
    if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
    return DEFAULT_CONFIG;
};

export const saveNotificationConfig = (config: NotificationConfig) => {
    localStorage.setItem('wf_notification_config', JSON.stringify(config));
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return;
    }

    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            ...options
        });

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        return notification;
    }
};

export const checkNotificationPermission = (): 'granted' | 'denied' | 'default' => {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
};
