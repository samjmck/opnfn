import superjson from "superjson";

declare const OPNFN_KV: KVNamespace;

export async function cached<T, TParams extends any[]>(
    func: (...params: TParams) => T,
    params: TParams,
    key?: string,
    expirationSeconds?: number,
): Promise<T> {
    if(key === undefined) {
        key = `${func.name}:${superjson.stringify(params)}`;
    }
    console.log("1");
    const cachedResult = await OPNFN_KV.get(key);
    console.log("2");
    if(cachedResult !== null) {
        console.log("cached");
        return superjson.parse<T>(cachedResult);
    } else {
        console.log("not cached");
        const result = await Promise.resolve(func(...params));
        await OPNFN_KV.put(key, superjson.stringify(result), { expirationTtl: expirationSeconds });
        return result;
    }
}
