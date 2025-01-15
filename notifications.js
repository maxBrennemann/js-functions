export const notification = (info, type, details = null) => {
    const notification = notificationHTML(info, details, type);

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

const notificationHTML = (info, details, type) => {
    switch (type) {
        case "success":
            return notificationHTMLSuccess(info, details);
        case "warning":
            return notificationHTMLWarning(info, details);
        case "failure":
            return notificationHTMLFailure(info, details);
        default:
            return null;
    }
}

const notificationHTMLSuccess = (info, details) => {
    return `
    <div class="tw-fixed tw-right-3 tw-bottom-3 tw-rounded-lg tw-flex tw-bg-white">
        <div class="tw-bg-green-500 tw-w-3 tw-rounded-l-lg"></div>
        <div class="tw-p-2 tw-flex">
            <div class="tw-flex tw-flex-row tw-items-center tw-mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="tw-fill-green-500 tw-h-5 tw-w-5" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                </svg>
            </div>
            <div>
                <p class="tw-font-sans tw-font-semibold tw-text-base">Gespeichert</p>
                <p class="tw-font-sans tw-text-xs tw-text-gray-600">${info}</p>
            </div>
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn tw-fill-gray-600 tw-h-3 tw-w-3 tw-cursor-pointer">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
            </div>
        </div>
    </div>`;
}

const notificationHTMLFailure = (info, details) => {
    return `
    <div class="tw-fixed tw-right-3 tw-bottom-3 tw-rounded-lg tw-flex tw-bg-white">
        <div class="tw-bg-red-500 tw-w-3 tw-rounded-l-lg"></div>
        <div class="tw-p-2 tw-flex">
            <div class="tw-flex tw-flex-row tw-items-center tw-mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="tw-fill-red-500 tw-h-5 tw-w-5" viewBox="0 0 24 24">
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
            </div>
            <div>
                <p class="tw-font-sans tw-font-semibold tw-text-base">Fehler</p>
                <p class="tw-font-sans tw-text-xs tw-text-gray-600">${info}</p>
            </div>
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn tw-fill-gray-600 tw-h-3 tw-w-3 tw-cursor-pointer">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
            </div>
        </div>
    </div>`;
}

const notificationHTMLWarning = (info, details) => {
    return `
    <div class="tw-fixed tw-right-3 tw-bottom-3 tw-rounded-lg tw-flex tw-bg-white">
        <div class="tw-bg-orange-500 tw-w-3 tw-rounded-l-lg"></div>
        <div class="tw-p-2 tw-flex">
            <div class="tw-flex tw-flex-row tw-items-center tw-mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="tw-fill-orange-500 tw-h-5 tw-w-5" viewBox="0 0 24 24">
                    <path d="M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z" />
                </svg>
            </div>
            <div>
                <p class="tw-font-sans tw-font-semibold tw-text-base">Fehler</p>
                <p class="tw-font-sans tw-text-xs tw-text-gray-600">${info}</p>
            </div>
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="removeBtn tw-fill-gray-600 tw-h-3 tw-w-3 tw-cursor-pointer">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
            </div>
        </div>
    </div>`;
}
