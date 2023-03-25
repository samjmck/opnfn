import { Exchange } from "../exchange";
import { Money } from "../money";

export enum PeriodInterval {
    Day,
}

export interface ReadablePricingStore {
    getPrice(
        exchange: Exchange,
        ticker: string,
        start: Date,
        end: Date,
        periodInterval: PeriodInterval,
    ): Promise<Map<Date, Money>>;
}

export interface WritablePricingStore {
    setPrice(
        exchange: Exchange,
        ticker: string,
        prices: Map<Date, Money>,
    ): Promise<void>;
}

export interface ReadableStockSplitStore {
    getStockSplits(
        exchange: Exchange,
        ticker: string,
        start: Date,
        end: Date,
    ): Promise<Map<Date, number>>;
}

export interface WritableStockSplitStore {
    setStockSplits(
        exchange: Exchange,
        ticker: string,
        stockSplits: Map<Date, number>,
    ): Promise<void>;
}

export interface AllStores extends
    ReadablePricingStore,
    WritablePricingStore,
    ReadableStockSplitStore,
    WritableStockSplitStore {}