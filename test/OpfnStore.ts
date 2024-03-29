import {
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    Interval, ProfileStore,
    ReadableFXStore,
    ReadableStore,
    SearchResultItem,
    SearchStore, Split, StockSplitStore
} from "../src/store";
import { Exchange, exchangeToOperatingMic, micToExchange } from "../src/exchange";
import { Currency, OHLC } from "../src/money";
import { SearchResponse } from "../src/routes/search";
import { ExchangeRateCloseResponse, ExchangeRateResponse, HistoricalExchangeRateResponse } from "../src/routes/fx";
import { HistoricalPriceResponse, PriceCloseResponse, PriceResponse } from "../src/routes/pricing";
import { StockSplitsResponse } from "../src/routes/stock-splits";
import { ProfileResponse } from "../src/routes/profile";

export class OpnfnStore implements
    SearchStore,
    ReadableStore,
    ReadableFXStore,
    HistoricalReadableStore,
    HistoricalReadableFXStore,
    ProfileStore,
    StockSplitStore
{
    constructor(private baseUrl = "https://opnfn.com/v1") {}

    async getProfile(isin: string) {
        const response = await fetch(`${this.baseUrl}/profiles/isin/${isin}`);
        const json = await response.json<ProfileResponse>();
        return json;
    }

    async getStockSplitTotalMultiplier(
        since: Date,
        exchange: Exchange,
        ticker: string
    ) {
        const splits = await this.getStockSplits(since, new Date(), exchange, ticker);
        let multiplier = 1;
        for(const { split: splitMultiplier } of splits) {
            multiplier *= splitMultiplier;
        }
        return multiplier;
    }

    async getStockSplits(
        startTime: Date,
        endTime: Date,
        exchange: Exchange,
        ticker: string,
    ) {
        const response = await fetch(`${this.baseUrl}/stock_splits/exchange/${exchangeToOperatingMic(exchange)}/ticker/${ticker}/start/${startTime.toISOString()}/end/${endTime.toISOString()}`);
        const json = await response.json<StockSplitsResponse>();
        const results = <Split[]> [];
        for(const result of json) {
            results.push({
                time: new Date(result.time),
                split: result.split,
            });
        }
        return results;
    }

    async search(query: string) {
        const response = await fetch(`${this.baseUrl}/search?query=${query}`);
        const json = await response.json<SearchResponse>();
        const results = <SearchResultItem[]> [];
        for(const result of json) {
            results.push({
                name: result.name,
                exchange: micToExchange(result.exchange),
                ticker: result.ticker,
            });
        }
        return results;
    }

    async getExchangeRate(
        from: Currency,
        to: Currency,
    ) {
        const response = await fetch(`${this.baseUrl}/fx/from/${from}/to/${to}/latest`);
        const json = await response.json<ExchangeRateResponse>();
        return json.exchangeRate;
    }

    async getExchangeRateAtClose(
        from: Currency,
        to: Currency,
        time: Date,
    ) {
        const response = await fetch(`${this.baseUrl}/fx/from/${from}/to/${to}/close/time/${time.toISOString()}`);
        const json = await response.json<ExchangeRateCloseResponse>();
        return {
            exchangeRate: json.exchangeRate,
            time: new Date(json.time),
        };
    }

    async getHistoricalExchangeRate(
        from: Currency,
        to: Currency,
        startTime: Date,
        endTime: Date,
        interval: Interval,
    ) {
        const response = await fetch(`${this.baseUrl}/fx/from/${from}/to/${to}/period/start/${startTime.toISOString()}/end/${endTime.toISOString()}`);
        const json = await response.json<HistoricalExchangeRateResponse>();
        const historicalRatesMap = new Map<Date, OHLC>();
        for(const rate of json.exchangeRates) {
            historicalRatesMap.set(new Date(rate.time), {
                open: rate.open,
                high: rate.high,
                low: rate.low,
                close: rate.close,
            });
        }
        return historicalRatesMap;
    }

    async getByTicker(
        exchange: Exchange,
        ticker: string,
    ) {
        const response = await fetch(`${this.baseUrl}/prices/exchange/${exchangeToOperatingMic(exchange)}/ticker/${ticker}/latest?useIntegers=true`);
        const json = await response.json<PriceResponse>();
        return {
            currency: json.currency,
            amount: json.amount,
        };
    }

    async getAtCloseByTicker(
        exchange: Exchange,
        ticker: string,
        time: Date,
        adjustedForSplits: boolean,
    ) {
        const response = await fetch(`${this.baseUrl}/prices/exchange/${exchangeToOperatingMic(exchange)}/ticker/${ticker}/close/time/${time.toISOString()}?useIntegers=true&adjustedForSplits=${adjustedForSplits}`);
        const json = await response.json<PriceCloseResponse>();
        return {
            currency: json.currency,
            amount: json.amount,
            time: new Date(json.time),
        };
    }

    async getHistoricalByTicker(
        exchange: Exchange,
        ticker: string,
        startTime: Date,
        endTime: Date,
        interval: Interval,
        adjustedForSplits: boolean,
    ) {
        const response = await fetch(`${this.baseUrl}/prices/exchange/${exchangeToOperatingMic(exchange)}/ticker/${ticker}/period/start/${startTime.toISOString()}/end/${endTime.toISOString()}?useIntegers=true&adjustedForSplits=${adjustedForSplits}`);
        const json = await response.json<HistoricalPriceResponse>();
        const historicalPricesMap = new Map<Date, OHLC>();
        for(const price of json.prices) {
            historicalPricesMap.set(new Date(price.time), {
                open: price.open,
                high: price.high,
                low: price.low,
                close: price.close,
            });
        }
        return {
            currency: json.currency,
            map: historicalPricesMap,
        };
    }
}
