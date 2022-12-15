import { Router } from "itty-router";
import { HistoricalReadableStore, Interval, ReadableStore } from "../store";
import { OHLC } from "../money";
import { micToExchange } from "../exchange";
import { Cache } from "../cache";

export function registerSecuritiesRoutes(
    router: Router,
    readableStore: ReadableStore,
    historicalReadableStore: HistoricalReadableStore,
    cache: Cache,
) {
    router.get("/prices/exchange/:mic/ticker/:ticker/latest", async request => {
        const { mic, ticker } = <{ mic: string, ticker: string }> request.params;
        const { useIntegers: useIntegersString } =
            <{ useIntegers: string }> request.query;
        const useIntegers = useIntegersString === "true";

        if(mic === undefined || ticker === undefined) {
            return new Response(null, { status: 422 });
        }

        try {
            const exchange = micToExchange(mic);
            const money = await readableStore.getByTicker(exchange, ticker);
            if(!useIntegers) {
                money.amount /= 100;
            }
            return new Response(
                JSON.stringify(money),
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        } catch(error) {
            return new Response(
                JSON.stringify({ error }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }
    });

    router.get("/prices/exchange/:mic/ticker/:ticker/period/start/:startTime/end/:endTime", async(request, event) => {
        const { mic, ticker, startTime: startTimeString, endTime: endTimeString } =
            <{ mic: string, ticker: string, startTime: string, endTime: string }> request.params;
        const { interval, adjustedForStockSplits: adjustedForStockSplitsString, useIntegers: useIntegersString } =
            <{ interval?: Interval, adjustedForStockSplits: string, useIntegers: string }> request.query;
        const useIntegers = useIntegersString === "true";
        const startTime = new Date(decodeURIComponent(startTimeString));
        const endTime = new Date(decodeURIComponent(endTimeString));

        const cacheKey = `/prices/exchange/${mic}/ticker/${ticker}/period/start/${startTimeString}/end/${endTimeString}?interval=${interval}&adjustedForStockSplits=${adjustedForStockSplitsString}&useIntegers=${useIntegersString}`;
        const cachedResponse = await cache.get<string>(cacheKey);
        if(cachedResponse) {
            // Browser is not allowed to cache this response as the useIntegers query parameter is not part of the cache key
            // but useIntegers does change the response body
            return new Response(
                cachedResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        try {
            const exchange = micToExchange(mic);
            const { currency, map: historicalPricingMap } = await historicalReadableStore.getHistoricalByTicker(
                exchange,
                ticker,
                startTime,
                endTime,
                interval || Interval.Day,
                adjustedForStockSplitsString === "true" || adjustedForStockSplitsString === undefined,
            );
            const prices: ({ time: string } & OHLC)[] = [];
            for(const [time, ohlc] of historicalPricingMap) {
                if(useIntegers) {
                    prices.push({
                        time: time.toISOString(),
                        ...ohlc,
                    });
                } else {
                    prices.push({
                        time: time.toISOString(),
                        open: ohlc.open / 100,
                        high: ohlc.high / 100,
                        low: ohlc.low / 100,
                        close: ohlc.close / 100,
                    });
                }
            }

            const jsonResponse = JSON.stringify({ currency, prices });
            // Browser is not allowed to cache this response as the useIntegers query parameter is not part of the cache key
            // but useIntegers does change the response body
            const response = new Response(
                jsonResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, jsonResponse));
            return response;
        } catch(error) {
            console.log(error);
            return new Response(JSON.stringify({ error }), { status: 500 });
        }
    });

    router.get("/prices/exchange/:mic/ticker/:ticker/close/time/:time", async(request, event) => {
        const { mic, ticker, time: timeString } =
            <{ mic: string, ticker: string, time: string }> request.params;
        const { adjustedForSplits: adjustedForStockSplitsString, useIntegers: useIntegersString } =
            <{ adjustedForSplits: string, useIntegers: string }> request.query;
        const useIntegers = useIntegersString === "true";
        const adjustedForStockSplits = adjustedForStockSplitsString === "true" || adjustedForStockSplitsString === undefined;
        const time = new Date(decodeURIComponent(timeString));

        const cacheKey = `/prices/exchange/${mic}/ticker/${ticker}/close/time/${timeString}?adjustedForSplits=${adjustedForStockSplitsString}&useIntegers=${useIntegersString}`;
        const cachedResponse = await cache.get<string>(cacheKey);
        if(cachedResponse) {
            // Browser is not allowed to cache this response as the useIntegers query parameter is not part of the cache key
            // but useIntegers does change the response body
            return new Response(
                cachedResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        try {
            const exchange = micToExchange(mic);
            let { time: responseTime, currency, amount } = await historicalReadableStore.getAtCloseByTicker(
                exchange,
                ticker,
                time,
                adjustedForStockSplits,
            );
            if(!useIntegers) {
                amount /= 100;
            }
            const jsonResponse = JSON.stringify({ time: responseTime.toISOString(), currency, amount });
            const response = new Response(
                jsonResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, jsonResponse));
            return response;
        } catch(error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }
    });
}
