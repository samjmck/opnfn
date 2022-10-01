import { Exchange, HistoricalReadableFXStore, HistoricalReadableStore, ReadableFXStore, ReadableStore } from "../store";
import { Currency } from "../money.js";

export class CombinedHistoricalReadableStore implements HistoricalReadableStore {
    constructor(private stores: HistoricalReadableStore[]) {}

    async getAtClose(
        exchange: Exchange,
        ticker: string,
        time: number,
    ) {
        for(const store of this.stores) {
            try {
                return await store.getAtClose(exchange, ticker, time);
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

export class CombineHistoricalReadableFXStore implements HistoricalReadableFXStore {
    constructor(private stores: HistoricalReadableFXStore[]) {}

    async getExchangeRateAtClose(
        from: Currency,
        to: Currency,
        time: number,
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
}
