import { Currency, Money, OHLC } from "./money";
import { Exchange } from "./exchange";

export enum Interval {
    Day = "day",
}

export interface SearchResultItem {
    name: string;
    exchange: Exchange;
    ticker: string;
}

export interface SearchStore {
    search(term: string): Promise<SearchResultItem[]>;
}

export interface HistoricalReadableStore {
    getAtCloseByTicker(
        exchange: Exchange,
        ticker: string,
        time: Date,
        adjustedForSplits: boolean,
    ): Promise<{ time: Date } & Money>;
    getHistoricalByTicker(
        exchange: Exchange,
        ticker: string,
        startTime: Date,
        endTime: Date,
        interval: Interval,
        adjustedForStockSplits: boolean,
    ): Promise<{
        currency: Currency;
        map: Map<Date, OHLC>;
    }>;
}

export interface ReadableStore {
    getByTicker(exchange: Exchange, ticker: string): Promise<Money>;
}

export interface ReadableFXStore {
    getExchangeRate(from: Currency, to: Currency): Promise<number>;
}

export interface HistoricalReadableFXStore {
    getExchangeRateAtClose(from: Currency, to: Currency, time: Date): Promise<{ time: Date, rate: number }>;
    getHistoricalExchangeRate(
        from: Currency,
        to: Currency,
        startTime: Date,
        endTime: Date,
        interval: Interval,
    ): Promise<Map<Date, OHLC>>;
}

export interface Split {
    time: Date;
    split: number;
}

export interface StockSplitStore {
    getStockSplitTotalMultiplier(since: Date, exchange: Exchange, ticker: string): Promise<number>;
    getStockSplits(
        startTime: Date,
        endTime: Date,
        exchange: Exchange,
        ticker: string,
    ): Promise<Split[]>
}
