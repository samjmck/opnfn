import { Cache } from './cache';
import { PeriodInterval, ReadablePricingStore, WritablePricingStore } from "./store";
import { Exchange } from "../exchange";
import { Money } from "../money";

export class Controller {
    constructor(
        private cache: Cache,
        private readablePricingStore: ReadablePricingStore,
        private writablePricingStore: WritablePricingStore,
    ) {}

    async getPrice(
        exchange: Exchange,
        ticker: string,
        start: Date,
        end: Date,
        periodInterval: PeriodInterval,
    ): Promise<Map<Date, Money>> {
        const key = `getPrice#${exchange}:${ticker}:${start}:${end}:${periodInterval}`;
        const cached = await this.cache.get<Map<Date, Money>>(key);
        if (cached !== null) {
            return cached;
        }
        return this.readablePricingStore.getPrice(exchange, ticker, start, end, periodInterval);
    }
}