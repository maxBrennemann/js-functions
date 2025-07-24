export interface AjaxResponse<T = any> {
    success: boolean;
    data: T | null;
    error: string | null;
    status: number | null;
}

export interface Ajax {
    autoHandleUnauthorized: boolean;

    post<T = any>(
        url: string,
        data?: Record<string, any>,
        jsonBody?: boolean
    ): Promise<AjaxResponse<T>>;

    get<T = any>(
        url: string,
        data?: Record<string, any>
    ): Promise<AjaxResponse<T>>;

    put<T = any>(
        url: string,
        data?: Record<string, any>,
        jsonBody?: boolean
    ): Promise<AjaxResponse<T>>;

    delete<T = any>(
        url: string,
        data?: Record<string, any>,
        jsonBody?: boolean
    ): Promise<AjaxResponse<T>>;

    uploadFiles<T = any>(
        files: FileList | File[] | null,
        location: string,
        additionalInfo?: Record<string, string>
    ): Promise<AjaxResponse<T>>;
}

export const ajax: Ajax;
