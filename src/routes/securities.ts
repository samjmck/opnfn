import { Router } from "itty-router";
import { CombinedHistoricalReadableStore, CombinedReadableStore } from "../stores/CombinedStore.js";
import { Interval} from "../store.js";
import { OHLC } from "../money.js";
import { micToExchange } from "../exchange.js";

export function registerSecuritiesRoutes(
    router: Router,
    combinedReadableStore: CombinedReadableStore,
    combinedHistoricalReadableStore: CombinedHistoricalReadableStore,
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
            const money = await combinedReadableStore.getByTicker(exchange, ticker);
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
        const cacheKey = new Request((new URL(request.url)).toString(), request);
        let cachedResponse = await cache.match(cacheKey);

        if(cachedResponse) {
            return cachedResponse;
        }

        const { mic, ticker, startTime: startTimeString, endTime: endTimeString } =
            <{ mic: string, ticker: string, startTime: string, endTime: string }> request.params;
        const { interval, adjustedForStockSplits: adjustedForStockSplitsString, useIntegers: useIntegersString } =
            <{ interval?: Interval, adjustedForStockSplits: string, useIntegers: string }> request.query;
        const useIntegers = useIntegersString === "true";
        const startTime = new Date(startTimeString);
        const endTime = new Date(endTimeString);

        try {
            const exchange = micToExchange(mic);
            const { currency, map: historicalPricingMap } = await combinedHistoricalReadableStore.getHistoricalByTicker(
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
            const response = new Response(
                JSON.stringify({
                    currency,
                    prices,
                }),
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, response.clone()));
            return response;
        } catch(error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }
    });

    router.get("/prices/exchange/:mic/ticker/:ticker/close/time/:time", async(request, event) => {
        const cacheKey = new Request((new URL(request.url)).toString(), request);
        let cachedResponse = await cache.match(cacheKey);

        if(cachedResponse) {
            return cachedResponse;
        }

        const { mic, ticker, time: timeString } =
            <{ mic: string, ticker: string, time: string }> request.params;
        const { adjustedForSplits: adjustedForStockSplitsString, useIntegers: useIntegersString } =
            <{ adjustedForSplits: string, useIntegers: string }> request.query;
        const useIntegers = useIntegersString === "true";
        const adjustedForStockSplits = adjustedForStockSplitsString === "true" || adjustedForStockSplitsString === undefined;
        const time = new Date(timeString);

        try {
            const exchange = micToExchange(mic);
            let { time: responseTime, currency, amount } = await combinedHistoricalReadableStore.getAtCloseByTicker(
                exchange,
                ticker,
                time,
                adjustedForStockSplits,
            );
            if(!useIntegers) {
                amount /= 100;
            }
            const response = new Response(
                JSON.stringify({
                    time: responseTime.toISOString(),
                    currency,
                    amount,
                }),
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, response.clone()));
            return response;
        } catch(error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }
    });
}
