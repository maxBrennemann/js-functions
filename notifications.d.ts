type NotificationType = "success" | "warning" | "failure" | "loading";

export declare class NotificationManager {
    private static instance: NotificationManager;
    private notificationKeys: Set<string>;
    private notificationElements: Map<string, Element>;
    private twPrefix: string;

    private constructor();

    setTwPrefix(twPrefix: string): void;

    notify(
        info: string,
        type: NotificationType,
        details?: string,
        duration?: number,
        onClose?: () => void,
        persist?: boolean,
        id?: string | null
    ): void;

    replace(
        id: string,
        info: string,
        type: NotificationType,
        details?: string,
        duration?: number,
        onClose?: () => void,
        persist?: boolean
    ): void;
}

export declare const setTwPrefix: (twPrefix: string) => void;

export declare const setNotificationPersistance: (isPersistant: boolean) => void;

export declare const notification: (
    info: string,
    type?: NotificationType,
    details?: string,
    duration?: number,
    onClose?: () => void,
    persist?: boolean
) => void;

export declare const notificationLoader: (
    id: string,
    info: string,
    details?: string,
    onClose?: () => void
) => void;

export declare const notificatinReplace: (
    id: string,
    info: string,
    type: NotificationType,
    details?: string,
    duration?: number,
    onClose?: () => void,
    persist?: boolean
) => void;
