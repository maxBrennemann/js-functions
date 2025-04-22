const NotificationManager = (function () {
    let instance;

    class NotificationManager {
        constructor() {
            if (instance) return instance;

            this.twPrefix = "";

            instance = this;
        }

        setTwPrefix(twPrefix) {
            this.twPrefix = twPrefix;
        }

        notify(info, type, details, onClose) {
            const notification = this.notificationHTML(info, details, type);

            if (notification == null) {
                return;
            }

            const template = document.createElement("template");
            template.innerHTML = notification;

            const element = template.content.firstElementChild;
            const notificationContainer = this.#getNotificationContainer();
            notificationContainer.appendChild(element);
        
            const removeNotificationHandler = () => {
                this.#removeNotification(element, onClose);
            };

            setTimeout(removeNotificationHandler, 5000);

            const removeBtn = element.querySelector(".removeBtn");
            if (removeBtn) {
                removeBtn.addEventListener("click", removeNotificationHandler);
            }
        }

        notificationHTML = (info, details, type) => {
            switch (type) {
                case "success":
                    return this.#notificationHTMLSuccess(info, details);
                case "warning":
                    return this.#notificationHTMLWarning(info, details);
                case "failure":
                    return this.#notificationHTMLFailure(info, details);
                default:
                    return null;
            }
        }

        #removeNotification = (element, onClose) => {
            element?.classList.add(`${this.twPrefix}opacity-0`, `${this.twPrefix}transition-opacity`);
            setTimeout(() => {
                element?.remove();
                if (typeof onClose === "function") {
                    onClose();
                }
            }, 300);
        }

        #getNotificationContainer = () => {
            let container = document.querySelector("#notificationContainer");
            if (!container) {
                container = document.createElement("div");
                container.id = "notificationContainer";
                container.className = `${this.twPrefix}fixed ${this.twPrefix}right-0 ${this.twPrefix}bottom-3 ${this.twPrefix}flex ${this.twPrefix}flex-col-reverse ${this.twPrefix}gap-2 ${this.twPrefix}z-50 ${this.twPrefix}h-3/6 ${this.twPrefix}overflow-y-scroll ${this.twPrefix}py-3 ${this.twPrefix}pr-3`;
                document.body.appendChild(container);
            }
            return container;
        }

        #notificationHTMLSuccess = (info, details) => {
            return `
            <div class="${this.twPrefix}rounded-lg ${this.twPrefix}flex ${this.twPrefix}bg-neutral-50 ${this.twPrefix}shadow-md" role="alert" aria-live="polite" tabindex="0">
                <div class="${this.twPrefix}bg-green-500 ${this.twPrefix}w-3 ${this.twPrefix}rounded-l-lg"></div>
                <div class="${this.twPrefix}p-2 ${this.twPrefix}flex">
                    <div class="${this.twPrefix}flex ${this.twPrefix}flex-row ${this.twPrefix}items-center ${this.twPrefix}mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="${this.twPrefix}fill-green-500 ${this.twPrefix}h-5 ${this.twPrefix}w-5" viewBox="0 0 24 24">
                            <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                        </svg>
                    </div>
                    <div>
                        <p class="${this.twPrefix}font-sans ${this.twPrefix}font-semibold ${this.twPrefix}text-base">Gespeichert</p>
                        <p class="${this.twPrefix}font-sans ${this.twPrefix}text-xs ${this.twPrefix}text-gray-600">${info}</p>
                    </div>
                    <div class="${this.twPrefix}inline-flex ${this.twPrefix}items-center ${this.twPrefix}pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${this.twPrefix}fill-gray-600 ${this.twPrefix}h-3 ${this.twPrefix}w-3 ${this.twPrefix}cursor-pointer">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                    </div>
                </div>
            </div>`;
        }

        #notificationHTMLFailure = (info, details) => {
            return `
            <div class="${this.twPrefix}rounded-lg ${this.twPrefix}flex ${this.twPrefix}bg-neutral-50 ${this.twPrefix}shadow-md" role="alert" aria-live="polite" tabindex="0">
                <div class="${this.twPrefix}bg-red-500 ${this.twPrefix}w-3 ${this.twPrefix}rounded-l-lg"></div>
                <div class="${this.twPrefix}p-2 ${this.twPrefix}flex">
                    <div class="${this.twPrefix}flex ${this.twPrefix}flex-row ${this.twPrefix}items-center ${this.twPrefix}mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="${this.twPrefix}fill-red-500 ${this.twPrefix}h-5 ${this.twPrefix}w-5" viewBox="0 0 24 24">
                            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                    </div>
                    <div>
                        <p class="${this.twPrefix}font-sans ${this.twPrefix}font-semibold ${this.twPrefix}text-base">Fehler</p>
                        <p class="${this.twPrefix}font-sans ${this.twPrefix}text-xs ${this.twPrefix}text-gray-600">${info}</p>
                    </div>
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${this.twPrefix}fill-gray-600 ${this.twPrefix}h-3 ${this.twPrefix}w-3 ${this.twPrefix}cursor-pointer">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                    </div>
                </div>
            </div>`;
        }

        #notificationHTMLWarning = (info, details) => {
            return `
            <div class="${this.twPrefix}rounded-lg ${this.twPrefix}flex ${this.twPrefix}bg-neutral-50 ${this.twPrefix}shadow-md" role="alert" aria-live="polite" tabindex="0">
                <div class="${this.twPrefix}bg-orange-500 ${this.twPrefix}w-3 ${this.twPrefix}rounded-l-lg"></div>
                <div class="${this.twPrefix}p-2 ${this.twPrefix}flex">
                    <div class="${this.twPrefix}flex ${this.twPrefix}flex-row ${this.twPrefix}items-center ${this.twPrefix}mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="${this.twPrefix}fill-orange-500 ${this.twPrefix}h-5 ${this.twPrefix}w-5" viewBox="0 0 24 24">
                            <path d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z" />
                        </svg>
                    </div>
                    <div>
                        <p class="${this.twPrefix}font-sans ${this.twPrefix}font-semibold ${this.twPrefix}text-base">Fehler</p>
                        <p class="${this.twPrefix}font-sans ${this.twPrefix}text-xs ${this.twPrefix}text-gray-600">${info}</p>
                    </div>
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${this.twPrefix}fill-gray-600 ${this.twPrefix}h-3 ${this.twPrefix}w-3 ${this.twPrefix}cursor-pointer">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                    </div>
                </div>
            </div>`;
        }
    }

    return new NotificationManager();
})();

export const setTwPrefix = (twPrefix) => {
    NotificationManager.setTwPrefix(twPrefix);
}

export const notification = (info, type = "warning", details = "", onClose = () => {}) => {
    NotificationManager.notify(info, type, details);
}
