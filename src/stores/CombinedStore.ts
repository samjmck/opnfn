import {
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    Interval,
    ReadableFXStore,
    ReadableStore, SearchStore
} from "../store";
import { Currency } from "../money.js";
import { Exchange } from "../exchange.js";

export class CombinedSearchStore implements SearchStore {
    constructor(private stores: SearchStore[]) {}

    async search(term: string) {
        for(const store of this.stores) {
            try {
                return await store.search(
                    term
                );
            } catch(error) {
                console.error(`store ${store} failed search with term "${term}`, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed search with term "${term}"`);
    }
}

export class CombinedHistoricalReadableStore implements HistoricalReadableStore {
    constructor(private stores: HistoricalReadableStore[]) {}

    async getAtCloseByTicker(
        exchange: Exchange,
        ticker: string,
        time: Date,
        adjustedForSplits: boolean,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getAtCloseByTicker(
                    exchange,
                    ticker,
                    time,
                    adjustedForSplits,
                );
            } catch(error) {
                console.error(`store ${store} failed with exchange ${exchange} ticker ${ticker}: `, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed for exchange ${exchange} ticker ${ticker}`);
    }

    async getHistoricalByTicker(
        exchange: Exchange,
        ticker: string,
        startTime: Date,
        endTime: Date,
        interval: Interval,
        adjustedForStockSplits: boolean,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getHistoricalByTicker(
                    exchange,
                    ticker,
                    startTime,
                    endTime,
                    interval,
                    adjustedForStockSplits,
                );
            } catch(error) {
                console.error(`store ${store} failed with exchange ${exchange} ticker ${ticker}: `, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed for exchange ${exchange} ticker ${ticker}`);
    }
}

export class CombinedReadableStore implements ReadableStore {
    constructor(private stores: ReadableStore[]) {}

    async getByTicker(
        exchange: Exchange,
        ticker: string,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getByTicker(exchange, ticker);
            } catch(error) {
                console.error(`store ${store} failed with exchange ${exchange} ticker ${ticker}: `, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed for exchange ${exchange} ticker ${ticker}`);
    }
}

export class CombinedReadableFXStore implements ReadableFXStore {
    constructor(private stores: ReadableFXStore[]) {}

    async getExchangeRate(
        from: Currency,
        to: Currency,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getExchangeRate(from, to);
            } catch(error) {
                console.error(`store ${store} failed with from currency ${from} to currency ${to}`, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed for from currency ${from} to currency ${to}`);
    }
}

export class CombinedHistoricalReadableFXStore implements HistoricalReadableFXStore {
    constructor(private stores: HistoricalReadableFXStore[]) {}

    async getExchangeRateAtClose(
        from: Currency,
        to: Currency,
        time: Date,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getExchangeRateAtClose(from, to, time);
            } catch(error) {
                console.error(`store ${store} failed with from currency ${from} to currency ${to} at time ${time}`, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed for from currency ${from} to currency ${to} at time ${time}`);
    }

    async getHistoricalExchangeRate(
        from: Currency,
        to: Currency,
        startTime: Date,
        endTime: Date,
        interval: Interval,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getHistoricalExchangeRate(
                    from,
                    to,
                    startTime,
                    endTime,
                    interval,
                );
            } catch(error) {
                console.error(`store ${store} failed with from currency ${from} to currency ${to} at start time ${startTime} and end time ${endTime} and interval ${interval}`, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed for from currency ${from} to currency ${to} at start time ${startTime} and end time ${endTime} and interval ${interval}`);
    }
}
