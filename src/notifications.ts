export type NotificationType = "success" | "warning" | "failure" | "loading";

interface StoredNotification {
    id: string;
    info: string;
    type: NotificationType;
    details: string;
    duration: number;
    onClose?: () => void;
    persist: boolean;
    timestamp?: number;
}

class NotificationManagerImpl {
    #notificationElements = new Map<string, Element>();
    #twPrefix = "";
    #isPersistant = false;
    #storageKey = "notifications";
    #target: Element = document.body;

    setTwPrefix(twPrefix: string): void {
        this.#twPrefix = twPrefix;
    }

    setPersistance(isPersistant: boolean): void {
        this.#isPersistant = isPersistant;
        if (isPersistant) {
            this.#loadStoredNotifications();
        } else {
            localStorage.removeItem(this.#storageKey);
        }
    }

    setNotificationContainer(container: Element): void {
        this.#target = container;
    }

    notify(info: string, type: NotificationType, details = "", duration = 5000, onClose?: () => void, persist = false, id: string | null = null): void {
        const notifId = id ?? crypto.randomUUID();
        const html = this.#notificationHTML(info, type);
        if (html == null) return;

        const template = document.createElement("template");
        template.innerHTML = html;

        const element = template.content.firstElementChild!;
        const container = this.#getNotificationContainer();
        container.appendChild(element);

        const removeHandler = (): void => {
            this.#removeNotification(element, onClose, type, details);
        };

        const shouldAutoDismiss = type !== "loading" && type !== "failure" && !persist;
        if (shouldAutoDismiss) {
            setTimeout(removeHandler, duration);
        }

        element.querySelector(".removeBtn")?.addEventListener("click", removeHandler);

        const copySpan = element.querySelector(".copyBtn");
        if (copySpan) {
            const btn = this.#getCopyBtn(details);
            if (btn) copySpan.appendChild(btn);
        }

        this.#notificationElements.set(notifId, element);

        if (this.#isPersistant) {
            this.#storeNotification({ id: notifId, info, type, details, duration, onClose, persist });
        }
    }

    replace(id: string, info: string, type: NotificationType, details = "", duration = 5000, onClose?: () => void, persist = false): void {
        const old = this.#notificationElements.get(id);
        if (!old) return;

        old.classList.add(`${this.#twPrefix}opacity-0`, `${this.#twPrefix}transition-opacity`);
        setTimeout(() => old?.remove(), 300);

        this.notify(info, type, details, duration, onClose, persist);
    }

    #notificationHTML(info: string, type: NotificationType): string | null {
        switch (type) {
            case "success": return this.#notificationHTMLSuccess(info);
            case "warning": return this.#notificationHTMLWarning(info);
            case "failure": return this.#notificationHTMLFailure(info);
            case "loading": return this.#notificationHTMLLoading(info);
            default: return null;
        }
    }

    #storeNotification(n: StoredNotification): void {
        const stored: StoredNotification[] = JSON.parse(localStorage.getItem(this.#storageKey) ?? "[]");
        const entry = { ...n, timestamp: Date.now() };
        const idx = stored.findIndex(s => s.id === n.id);
        if (idx >= 0) stored[idx] = entry;
        else stored.push(entry);
        localStorage.setItem(this.#storageKey, JSON.stringify(stored));
    }

    #removeNotification(element: Element, onClose: (() => void) | undefined, type: NotificationType, details: string): void {
        element.classList.add(`${this.#twPrefix}opacity-0`, `${this.#twPrefix}transition-opacity`);
        setTimeout(() => {
            element.remove();
            if (type === "failure") console.error(details);
            if (type === "warning") console.warn(details);
            onClose?.();
        }, 300);

        const id = [...this.#notificationElements.entries()].find(([, el]) => el === element)?.[0];
        if (id) this.#removeStoredNotification(id);
    }

    #removeStoredNotification(id: string): void {
        const stored: StoredNotification[] = JSON.parse(localStorage.getItem(this.#storageKey) ?? "[]");
        localStorage.setItem(this.#storageKey, JSON.stringify(stored.filter(n => n.id !== id)));
    }

    #loadStoredNotifications(): void {
        const stored: StoredNotification[] = JSON.parse(localStorage.getItem(this.#storageKey) ?? "[]");
        const now = Date.now();
        stored.forEach(n => {
            if (!n.persist && n.duration && n.timestamp && now - n.timestamp > n.duration) return;
            this.notify(n.info, n.type, n.details, n.duration, () => this.#removeStoredNotification(n.id), n.persist, n.id);
        });
    }

    #getNotificationContainer(): Element {
        let container = this.#target.querySelector("#notificationContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "notificationContainer";
            container.className = `${this.#twPrefix}fixed ${this.#twPrefix}right-0 ${this.#twPrefix}bottom-3 ${this.#twPrefix}flex ${this.#twPrefix}flex-col-reverse ${this.#twPrefix}gap-2 ${this.#twPrefix}z-50 ${this.#twPrefix}h-3/6 ${this.#twPrefix}overflow-y-scroll ${this.#twPrefix}py-3 ${this.#twPrefix}pr-3 scrollbar-hide`;
            this.#target.appendChild(container);
        }
        return container;
    }

    #notificationHTMLSuccess(info: string): string {
        const p = this.#twPrefix;
        return `<div class="${p}rounded-lg ${p}flex ${p}bg-neutral-50 ${p}shadow-md" role="alert" aria-live="polite" tabindex="0">
            <div class="${p}bg-green-500 ${p}w-3 ${p}rounded-l-lg"></div>
            <div class="${p}p-2 ${p}flex">
                <div class="${p}flex ${p}flex-row ${p}items-center ${p}mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="${p}fill-green-500 ${p}h-5 ${p}w-5" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/></svg>
                </div>
                <div>
                    <p class="${p}font-sans ${p}font-semibold ${p}text-base">Gespeichert</p>
                    <p class="${p}font-sans ${p}text-xs ${p}text-gray-600 ${p}flex ${p}items-center">${info}<span class="${p}ml-2 copyBtn"></span></p>
                </div>
                <div class="${p}inline-flex ${p}items-center ${p}pl-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${p}fill-gray-600 ${p}h-3 ${p}w-3 ${p}cursor-pointer" title="Schließen"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
                </div>
            </div>
        </div>`;
    }

    #notificationHTMLFailure(info: string): string {
        const p = this.#twPrefix;
        return `<div class="${p}rounded-lg ${p}flex ${p}bg-neutral-50 ${p}shadow-md" role="alert" aria-live="polite" tabindex="0">
            <div class="${p}bg-red-500 ${p}w-3 ${p}rounded-l-lg"></div>
            <div class="${p}p-2 ${p}flex">
                <div class="${p}flex ${p}flex-row ${p}items-center ${p}mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="${p}fill-red-500 ${p}h-5 ${p}w-5" viewBox="0 0 24 24"><path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>
                </div>
                <div>
                    <p class="${p}font-sans ${p}font-semibold ${p}text-base">Fehler</p>
                    <p class="${p}font-sans ${p}text-xs ${p}text-gray-600 ${p}flex ${p}items-center">${info}<span class="${p}ml-2 copyBtn"></span></p>
                </div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${p}fill-gray-600 ${p}h-3 ${p}w-3 ${p}cursor-pointer"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
                </div>
            </div>
        </div>`;
    }

    #notificationHTMLWarning(info: string): string {
        const p = this.#twPrefix;
        return `<div class="${p}rounded-lg ${p}flex ${p}bg-neutral-50 ${p}shadow-md" role="alert" aria-live="polite" tabindex="0">
            <div class="${p}bg-orange-500 ${p}w-3 ${p}rounded-l-lg"></div>
            <div class="${p}p-2 ${p}flex">
                <div class="${p}flex ${p}flex-row ${p}items-center ${p}mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="${p}fill-orange-500 ${p}h-5 ${p}w-5" viewBox="0 0 24 24"><path d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z"/></svg>
                </div>
                <div>
                    <p class="${p}font-sans ${p}font-semibold ${p}text-base">Warnung</p>
                    <p class="${p}font-sans ${p}text-xs ${p}text-gray-600 ${p}flex ${p}items-center">${info}<span class="${p}ml-2 copyBtn"></span></p>
                </div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${p}fill-gray-600 ${p}h-3 ${p}w-3 ${p}cursor-pointer"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
                </div>
            </div>
        </div>`;
    }

    #notificationHTMLLoading(info: string): string {
        const p = this.#twPrefix;
        return `<div class="${p}rounded-lg ${p}flex ${p}bg-neutral-50 ${p}shadow-md" role="alert" aria-live="polite" tabindex="0">
            <div class="${p}bg-cyan-500 ${p}w-3 ${p}rounded-l-lg"></div>
            <div class="${p}p-2 ${p}flex">
                <div class="${p}flex ${p}flex-row ${p}items-center ${p}mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="${p}fill-cyan-500 ${p}h-5 ${p}w-5" viewBox="0 0 24 24">
                        <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/>
                        <path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/></path>
                    </svg>
                </div>
                <div>
                    <p class="${p}font-sans ${p}font-semibold ${p}text-base">Lädt...</p>
                    <p class="${p}font-sans ${p}text-xs ${p}text-gray-600 ${p}flex ${p}items-center">${info}</p>
                </div>
                <div class="${p}inline-flex ${p}items-center ${p}pl-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${p}fill-gray-600 ${p}h-3 ${p}w-3 ${p}cursor-pointer"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
                </div>
            </div>
        </div>`;
    }

    #getCopyBtn(details: string): HTMLButtonElement | null {
        if (!details) return null;

        const copyContent = document.createElement("input");
        copyContent.value = details;
        copyContent.classList.add(`${this.#twPrefix}hidden`);

        const copyBtn = document.createElement("button");
        copyBtn.className = `${this.#twPrefix}border-none ${this.#twPrefix}flex ${this.#twPrefix}items-center`;
        copyBtn.addEventListener("click", () => {
            copyContent.select();
            copyContent.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(copyContent.value);
        });
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="9px" height="9px" class="${this.#twPrefix}fill-gray-600"><title>content-copy</title><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/></svg>`;

        return copyBtn;
    }
}

const notificationManager = new NotificationManagerImpl();

export const setTwPrefix = (twPrefix: string): void => notificationManager.setTwPrefix(twPrefix);
export const setNotificationPersistance = (isPersistant = true): void => notificationManager.setPersistance(isPersistant);
export const setNotificationContainer = (container: Element): void => notificationManager.setNotificationContainer(container);

export const notification = (info: string, type: NotificationType = "warning", details = "", duration = 5000, onClose?: () => void, persist = false): void => {
    notificationManager.notify(info, type, details, duration, onClose, persist, null);
};

export const notificationLoader = (id: string, info: string, details = "", onClose?: () => void): void => {
    notificationManager.notify(info, "loading", details, 0, onClose, true, id);
};

export const notificationReplace = (id: string, info: string, type: NotificationType, details = "", duration = 5000, onClose?: () => void, persist = false): void => {
    notificationManager.replace(id, info, type, details, duration, onClose, persist);
};
