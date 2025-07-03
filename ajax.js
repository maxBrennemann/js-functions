export const ajax = {
    autoHandleUnauthorized: false,

    async post(url, data = {}, jsonBody = true) {
        return request(url, data, "POST", jsonBody);
    },

    async get(url, data = {}) {
        return request(url, data, "GET");
    },

    async put(url, data = {}, jsonBody = true) {
        return request(url, data, "PUT", jsonBody);
    },

    async delete(url, data = {}, jsonBody = true) {
        return request(url, data, "DELETE", jsonBody);
    },

    async uploadFiles(files, location, additionalInfo = {}) {
        if (!files || files.length === 0) {
            return { success: false, data: null, error: "No files provided", status: null };
        }

        const formData = new FormData();
        Array.from(files).forEach(file => formData.append("files[]", file));
        Object.entries(additionalInfo).forEach(([key, value]) => formData.set(key, value));

        try {
            const response = await fetch(location, {
                method: "POST",
                body: formData
            });

            const json = await tryParseJSON(response);
            const success = response.ok;

            if (!success && response.status === 401 && this.autoHandleUnauthorized) {
                console.warn("Unauthorized - reloading...");
                location.reload();
            }

            return {
                success,
                data: success ? json : null,
                error: success ? null : json?.error || `HTTP ${response.status}`,
                status: response.status
            };
        } catch (err) {
            return { success: false, data: null, error: err.message, status: null };
        }
    }
};

async function request(url, data, method, jsonBody = true) {
    const options = { method, headers: {} };

    if (method === "GET") {
        const paramString = buildParams(data);
        url += paramString ? `?${paramString}` : "";
    } else if (jsonBody) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(data);
    } else {
        options.headers["Content-Type"] = "application/x-www-form-urlencoded";
        options.body = buildParams(data);
    }

    try {
        const response = await fetch(url, options);
        const json = await tryParseJSON(response);
        const success = response.ok;

        if (!success && response.status === 401 && ajax.autoHandleUnauthorized) {
            console.warn("Unauthorized - reloading...");
            location.reload();
        }

        return {
            success,
            data: success ? json : null,
            error: success ? null : json?.error || `HTTP ${response.status}`,
            status: response.status
        };
    } catch (err) {
        return { success: false, data: null, error: err.message, status: null };
    }
}

function buildParams(data) {
    return Object.entries(data)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
}

async function tryParseJSON(response) {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
