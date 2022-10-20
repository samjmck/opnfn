import { Router } from "itty-router";
import { CombinedHistoricalReadableFXStore, CombinedReadableFXStore } from "../stores/CombinedStore.js";
import { Interval } from "../store.js";
import { Currency, OHLC } from "../money.js";

export function registerFxRoutes(
    router: Router,
    combinedReadableFxStore: CombinedReadableFXStore,
    combinedHistoricalReadableFxStore: CombinedHistoricalReadableFXStore,
    cache: Cache
) {
    router.get("/fx/from/:from/to/:to/latest", async request => {
        const { from, to } = <{ from: Currency, to: Currency }> request.params;
        if(from === undefined || to === undefined) {
            return new Response(null, { status: 422 });
        }
        try {
            return new Response(
                JSON.stringify({ exchangeRate: await combinedReadableFxStore.getExchangeRate(from, to) }),
                {
                    status: 202,
                },
            );
        } catch(error) {
            return new Response(
                JSON.stringify({ error }),
                {
                    status: 500,
                },
            );
        }
    });

    router.get("/fx/from/:from/to/:to/historical/start/:startTime/end/:endTime", async(request, event) => {
        const cacheKey = new Request((new URL(request.url)).toString(), request);
        let cachedResponse = await cache.match(cacheKey);

        if(cachedResponse) {
            return cachedResponse;
        }

        const { from, to, startTime: startTimeString, endTime: endTimeString } =
            <{ from: Currency, to: Currency, startTime: string, endTime: string }> request.params;
        const { interval } =
            <{ interval?: Interval }> request.query;
        const startTime = new Date(startTimeString);
        const endTime = new Date(endTimeString);
        try {
            const historicalPriceMap = await combinedHistoricalReadableFxStore.getHistoricalExchangeRate(
                from,
                to,
                startTime,
                endTime,
                interval || Interval.Day,
            );
            const exchangeRates: ({ time: string } & OHLC)[] = [];
            for(const [time, ohlc] of historicalPriceMap) {
                exchangeRates.push({
                    time: time.toISOString(),
                    ...ohlc,
                });
            }
            const response = new Response(
                JSON.stringify({ exchangeRates }),
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "s-max-age=31536000",
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