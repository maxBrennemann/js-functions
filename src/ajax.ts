export type AjaxResponse<T = any> =
    | { success: true; data: T; error: null; status: number }
    | { success: false; data: null; error: string; status: number | null };

export const ajax = {
    autoHandleUnauthorized: false,

    async post<T = any>(url: string, data: Record<string, any> = {}, jsonBody = true): Promise<AjaxResponse<T>> {
        return request<T>(url, data, "POST", jsonBody);
    },

    async get<T = any>(url: string, data: Record<string, any> = {}): Promise<AjaxResponse<T>> {
        return request<T>(url, data, "GET");
    },

    async put<T = any>(url: string, data: Record<string, any> = {}, jsonBody = true): Promise<AjaxResponse<T>> {
        return request<T>(url, data, "PUT", jsonBody);
    },

    async delete<T = any>(url: string, data: Record<string, any> = {}, jsonBody = true): Promise<AjaxResponse<T>> {
        return request<T>(url, data, "DELETE", jsonBody);
    },

    async uploadFiles<T = any>(files: FileList | File[] | null, location: string, additionalInfo: Record<string, string> = {}): Promise<AjaxResponse<T>> {
        if (!files || files.length === 0) {
            return { success: false, data: null, error: "No files provided", status: null };
        }

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append("files[]", file));
        Object.entries(additionalInfo).forEach(([key, value]) => formData.set(key, value));

        try {
            const response = await fetch(location, {
                method: "POST",
                body: formData,
            });

            const json = await tryParseJSON(response);
            const success = response.ok;

            if (!success && response.status === 401 && ajax.autoHandleUnauthorized) {
                console.warn("Unauthorized - reloading...");
                window.location.reload();
            }

            return {
                success,
                data: success ? json : null,
                error: success ? null : json?.error ?? `HTTP ${response.status}`,
                status: response.status,
            } as AjaxResponse<T>;
        } catch (err) {
            return { success: false, data: null, error: (err as Error).message, status: null };
        }
    },
};

async function request<T = any>(url: string, data: Record<string, any>, method: string, jsonBody = true): Promise<AjaxResponse<T>> {
    const headers: Record<string, string> = {};
    const options: RequestInit = { method, headers };

    if (method === "GET") {
        const paramString = buildParams(data);
        url += paramString ? `?${paramString}` : "";
    } else if (jsonBody) {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(data);
    } else {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        options.body = buildParams(data);
    }

    try {
        const response = await fetch(url, options);
        const json = await tryParseJSON(response);
        const success = response.ok;

        if (!success && response.status === 401 && ajax.autoHandleUnauthorized) {
            console.warn("Unauthorized - reloading...");
            window.location.reload();
        }

        return {
            success,
            data: success ? json : null,
            error: success ? null : json?.error ?? `HTTP ${response.status}`,
            status: response.status,
        } as AjaxResponse<T>;
    } catch (err) {
        return { success: false, data: null, error: (err as Error).message, status: null };
    }
}

function buildParams(data: Record<string, any>): string {
    return Object.entries(data)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
}

async function tryParseJSON(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
