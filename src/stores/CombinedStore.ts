import {
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    Interval,
    ReadableFXStore,
    ReadableStore, SearchStore
} from "../store";
import { Currency } from "../money.js";
import { Exchange } from "../exchange.js";
import { cached } from "../cache.js";

async function retry<TStore, TRes>(max: number, stores: TStore[], call: (store: TStore) => Promise<TRes>): Promise<TRes> {
    for(let i = 0; i < max; i++) {
        if(i > 0) {
            console.log(`Retrying all stores time ${i + 1}...`);
        }
        for(const store of stores) {
            try {
                return await call(store);
            } catch(error) {
                console.log(`${call.name} failed with ${store}`, error);
                console.log("Trying next store...");
            }
        }
    }
    throw new Error(`All stores failed for ${call.name}`);
}

export class CombinedSearchStore implements SearchStore {
    constructor(private stores: SearchStore[]) {}

    search(term: string) {
        return retry(2, this.stores, store => store.search(term));
    }
}

export class CombinedHistoricalReadableStore implements HistoricalReadableStore {
    constructor(private stores: HistoricalReadableStore[]) {}

    getAtCloseByTicker(
        exchange: Exchange,
        ticker: string,
        time: Date,
        adjustedForSplits: boolean,
    ) {
        return retry(2, this.stores, store => store.getAtCloseByTicker(exchange, ticker, time, adjustedForSplits));
    }

    getHistoricalByTicker(
        exchange: Exchange,
        ticker: string,
        startTime: Date,
        endTime: Date,
        interval: Interval,
        adjustedForStockSplits: boolean,
    ) {
        return retry(2, this.stores, store => store.getHistoricalByTicker(exchange, ticker, startTime, endTime, interval, adjustedForStockSplits));
    }
}

export class CachedCombinedHistoricalReadableStore extends CombinedHistoricalReadableStore {
    async getAtCloseByTicker(exchange: Exchange, ticker: string, time: Date, adjustedForSplits: boolean) {
        return await cached(super.getAtCloseByTicker, [exchange, ticker, time, adjustedForSplits]);
    }

    async getHistoricalByTicker(exchange: Exchange, ticker: string, startTime: Date, endTime: Date, interval: Interval, adjustedForStockSplits: boolean) {
        return await cached(super.getHistoricalByTicker, [exchange, ticker, startTime, endTime, interval, adjustedForStockSplits]);
    }
}

export class CombinedReadableStore implements ReadableStore {
    constructor(private stores: ReadableStore[], private maxRetry = 3) {}

    getByTicker(
        exchange: Exchange,
        ticker: string,
    ) {
        return retry(2, this.stores, store => store.getByTicker(exchange, ticker));
    }
}

export class CombinedReadableFXStore implements ReadableFXStore {
    constructor(private stores: ReadableFXStore[]) {}

    getExchangeRate(
        from: Currency,
        to: Currency,
    ) {
        return retry(2, this.stores, store => store.getExchangeRate(from, to));
    }
}

export class CombinedHistoricalReadableFXStore implements HistoricalReadableFXStore {
    constructor(private stores: HistoricalReadableFXStore[]) {
        console.log("constructor");
        console.log(stores.length);
    }

    getExchangeRateAtClose(
        from: Currency,
        to: Currency,
        time: Date,
    ) {
        return retry(2, this.stores, store => store.getExchangeRateAtClose(from, to, time));
    }

    getHistoricalExchangeRate(
        from: Currency,
        to: Currency,
        startTime: Date,
        endTime: Date,
        interval: Interval,
    ) {
        return retry(2, this.stores, store => store.getHistoricalExchangeRate(
            from,
            to,
            startTime,
            endTime,
            interval,
        ));
    }
}

export class CachedCombinedHistoricalReadableFXStore implements HistoricalReadableFXStore {
    private store: CombinedHistoricalReadableFXStore;

    constructor(stores: HistoricalReadableFXStore[]) {
        this.store = new CombinedHistoricalReadableFXStore(stores);
    }

    async getExchangeRateAtClose(from: Currency, to: Currency, time: Date) {
        return await cached(this.store.getExchangeRateAtClose, [from, to, time]);
    }

    async getHistoricalExchangeRate(from: Currency, to: Currency, startTime: Date, endTime: Date, interval: Interval) {
        return await cached(this.store.getHistoricalExchangeRate, [from, to, startTime, endTime, interval]);
    }
}
