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

        notify(info, type = "warning", details = "") {
            const notification = this.notificationHTML(info, details, type);

            if (notification == null) {
                return;
            }
        
            const template = document.createElement("template");
            template.innerHTML = notification;
        
            const element = template.content.firstElementChild;
            document.body.appendChild(element);
        
            setTimeout(() => {
                element?.parentElement?.removeChild(element);
            }, 5000);
        
            const removeBtn = element.querySelector(".removeBtn");
            removeBtn.addEventListener("click", () => {
                element?.parentElement?.removeChild(element);
            });
        }

        notificationHTML = (info, details, type) => {
            switch (type) {
                case "success":
                    return this.notificationHTMLSuccess(info, details);
                case "warning":
                    return this.notificationHTMLWarning(info, details);
                case "failure":
                    return this.notificationHTMLFailure(info, details);
                default:
                    return null;
            }
        }

        notificationHTMLSuccess = (info, details) => {
            return `
            <div class="${this.twPrefix}fixed ${this.twPrefix}right-3 ${this.twPrefix}bottom-3 ${this.twPrefix}rounded-lg ${this.twPrefix}flex ${this.twPrefix}bg-white">
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
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn ${this.twPrefix}fill-gray-600 ${this.twPrefix}h-3 ${this.twPrefix}w-3 ${this.twPrefix}cursor-pointer">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                    </div>
                </div>
            </div>`;
        }

        notificationHTMLFailure = (info, details) => {
            return `
            <div class="${this.twPrefix}fixed ${this.twPrefix}right-3 ${this.twPrefix}bottom-3 ${this.twPrefix}rounded-lg ${this.twPrefix}flex ${this.twPrefix}bg-white">
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

        notificationHTMLWarning = (info, details) => {
            return `
            <div class="${this.twPrefix}fixed ${this.twPrefix}right-3 ${this.twPrefix}bottom-3 ${this.twPrefix}rounded-lg ${this.twPrefix}flex ${this.twPrefix}bg-white">
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

export const notification = (info, type = "warning", details = "") => {
   NotificationManager.notify(info, type, details);
}
