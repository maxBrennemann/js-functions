export declare class DeviceDetector {
    static isMobile(): boolean;
    static isMobileTablet(): boolean;
    static getBrowser(): "MS Edge" | "Edge (chromium based)" | "Opera" | "Chrome" | "MS IE" | "Mozilla Firefox" | "Safari" | "Edge" | "other";
    static getOS(): "Mac OS" | "iOS" | "Windows" | "Android" | "Linux" | null;
    static getLocation(): void | GeolocationPosition;
}
