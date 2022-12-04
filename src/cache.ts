import superjson from "superjson";

export interface Cache {
    get<T>(key: string): Promise<T | null>;
    put(key: string, value: unknown, expirationSeconds?: number): Promise<void>;
}

export class KVCache implements Cache {
    constructor(private kv: KVNamespace) {}

    async get<T extends unknown>(key: string): Promise<T | null> {
        const cachedResult = await this.kv.get(key);
        if(cachedResult !== null) {
            return superjson.parse<T>(cachedResult);
        } else {
            return null;
        }
    }

    async put(key: string, value: unknown, expirationSeconds?: number): Promise<void> {
        await this.kv.put(key, superjson.stringify(value), { expirationTtl: expirationSeconds });
    }
}
