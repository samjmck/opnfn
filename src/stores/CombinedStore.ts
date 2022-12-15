import {
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    Interval,
    ReadableFXStore,
    ReadableStore, SearchStore
} from "../store";
import { Currency } from "../money";
import { Exchange } from "../exchange";

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
    constructor(protected stores: SearchStore[]) {}

    search(term: string) {
        return retry(2, this.stores, store => store.search(term));
    }
}

export class CombinedHistoricalReadableStore implements HistoricalReadableStore {
    constructor(protected stores: HistoricalReadableStore[]) {}

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

export class CombinedReadableStore implements ReadableStore {
    constructor(protected stores: ReadableStore[], private maxRetry = 3) {}

    getByTicker(
        exchange: Exchange,
        ticker: string,
    ) {
        return retry(2, this.stores, store => store.getByTicker(exchange, ticker));
    }
}

export class CombinedReadableFXStore implements ReadableFXStore {
    constructor(protected stores: ReadableFXStore[]) {}

    getExchangeRate(
        from: Currency,
        to: Currency,
    ) {
        return retry(2, this.stores, store => store.getExchangeRate(from, to));
    }
}

export class CombinedHistoricalReadableFXStore {
    constructor(protected stores: HistoricalReadableFXStore[]) {}

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
