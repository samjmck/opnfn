export interface Cache {
    // expires is in seconds
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, expires: number | undefined): void;
}