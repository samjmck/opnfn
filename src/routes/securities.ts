import { Router } from "itty-router";
import { CombinedHistoricalReadableStore, CombinedReadableStore } from "../stores/CombinedStore.js";
import { Interval, micToExchange } from "../store.js";
import { OHLC } from "../money.js";

export function registerSecuritiesRoutes(
    router: Router,
    combinedReadableStore: CombinedReadableStore,
    combinedHistoricalReadableStore: CombinedHistoricalReadableStore,
    cache: Cache,
) {
    router.get("/prices/exchange/:mic/security/:ticker/latest", async request => {
        const { mic, ticker } = <{ mic: string, ticker: string }> request.params;
        if(mic === undefined || ticker === undefined) {
            return new Response(null, { status: 422 });
        }
        try {
            const exchange = micToExchange(mic);
            return new Response(
                JSON.stringify(await combinedReadableStore.get(exchange, ticker)),
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

    router.get("/prices/exchange/:mic/security/:ticker/historical", async(request, event) => {
        const cacheKey = new Request((new URL(request.url)).toString(), request);
        let cachedResponse = await cache.match(cacheKey);

        if(cachedResponse) {
            console.log("using cached");
            return cachedResponse;
        }

        const { mic, ticker } = <{ mic: string, ticker: string }> request.params;
        if(mic === undefined || ticker === undefined) {
            return new Response(null, { status: 422 });
        }
        const { startTime: startTimeString, endTime: endTimeString, interval, adjustedForStockSplits: adjustedForStockSplitsString } =
            <{ startTime: string, endTime: string, interval?: Interval, adjustedForStockSplits: string }> request.query;
        if(startTimeString === undefined || endTimeString === undefined) {
            return new Response(null, { status: 422 });
        }
        const startTime = new Date(startTimeString);
        const endTime = new Date(endTimeString);
        try {
            const exchange = micToExchange(mic);
            const { currency, map: historicalPricingMap } = await combinedHistoricalReadableStore.getHistorical(
                exchange,
                ticker,
                startTime,
                endTime,
                interval || Interval.Day,
                adjustedForStockSplitsString === "true" || adjustedForStockSplitsString === undefined,
            );
            const prices: ({ time: string } & OHLC)[] = [];
            for(const [time, ohlc] of historicalPricingMap) {
                prices.push({
                    time: time.toISOString(),
                    ...ohlc,
                });
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
                        "Cache-Control": "shared, max-age=31536000, stale-if-error=31536000",
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
