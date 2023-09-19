export interface BaseApiResponse<T> {
    success: boolean;
    data: T;
}
