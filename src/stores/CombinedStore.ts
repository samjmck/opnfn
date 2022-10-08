import {
    Exchange,
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    Interval,
    ReadableFXStore,
    ReadableStore
} from "../store";
import { Currency } from "../money.js";

export class CombinedHistoricalReadableStore implements HistoricalReadableStore {
    constructor(private stores: HistoricalReadableStore[]) {}

    async getAtClose(
        exchange: Exchange,
        ticker: string,
        time: Date,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getAtClose(
                    exchange,
                    ticker,
                    time,
                );
            } catch(error) {
                console.error(`store ${store} failed with exchange ${exchange} ticker ${ticker}: `, error);
                console.log("trying next store...");
            }
        }
        throw new Error(`all stores failed for exchange ${exchange} ticker ${ticker}`);
    }

    async getHistorical(
        exchange: Exchange,
        ticker: string,
        startTime: Date,
        endTime: Date,
        interval: Interval,
        adjustedForStockSplits: boolean,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getHistorical(
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

    async get(
        exchange: Exchange,
        ticker: string,
    ) {
        for(const store of this.stores) {
            try {
                return await store.get(exchange, ticker);
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
