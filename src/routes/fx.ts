import { Router } from "itty-router";
import { HistoricalReadableFXStore, Interval, ReadableFXStore } from "../store.js";
import { Currency, OHLC } from "../money.js";
import { Cache } from "../cache.js";
import { corsHeaders } from "./cors.js";

export type ExchangeRateResponse = {
    exchangeRate: number;
};

export type ExchangeRateCloseResponse = {
    exchangeRate: number;
    time: string;
}

export type HistoricalExchangeRateResponse = {
    exchangeRates: ({ time: string } & OHLC)[];
};

export function registerFxRoutes(
    router: Router,
    readableFxStore: ReadableFXStore,
    historicalReadableFxStore: HistoricalReadableFXStore,
    cache: Cache
) {
    router.get("/fx/from/:from/to/:to/latest", async request => {
        const { from, to } = <{ from: Currency, to: Currency }> request.params;
        if(from === undefined || to === undefined) {
            return new Response(null, { status: 422 });
        }
        try {
            return new Response(
                JSON.stringify(<ExchangeRateResponse> { exchangeRate: await readableFxStore.getExchangeRate(from, to) }),
                {
                    status: 202,
                    headers: {
                        ...corsHeaders,
                    }
                },
            );
        } catch(error) {
            return new Response(
                JSON.stringify({ error }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                    }
                },
            );
        }
    });

    router.get("/fx/from/:from/to/:to/period/start/:startTime/end/:endTime", async(request, event) => {
        const { from, to, startTime: startTimeString, endTime: endTimeString } =
            <{ from: Currency, to: Currency, startTime: string, endTime: string }> request.params;
        const { interval } =
            <{ interval?: Interval }> request.query;

        console.log("call");

        const cacheKey = `/fx/from/${from}/to/${to}/period/start/${startTimeString}/end/${endTimeString}?interval=${interval}`;
        const cachedResponse = await cache.get<string>(cacheKey);
        if(cachedResponse) {
            return new Response(
                cachedResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=31536000", // 1 year cache
                        ...corsHeaders,
                    },
                },
            );
        }

        const startTime = new Date(decodeURIComponent(startTimeString));
        const endTime = new Date(decodeURIComponent(endTimeString));
        try {
            const historicalPriceMap = await historicalReadableFxStore.getHistoricalExchangeRate(
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
            const jsonResponse = JSON.stringify(<HistoricalExchangeRateResponse> { exchangeRates });
            const response = new Response(
                jsonResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=31536000", // 1 year cache
                        ...corsHeaders,
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, jsonResponse));
            return response;
        } catch(error) {
            return new Response(
                JSON.stringify({ error }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                    }
                }
            );
        }
    });

    router.get("/fx/from/:from/to/:to/close/time/:time", async(request, event) => {
        const { from, to, time: timeString } = <{ from: Currency, to: Currency, time: string }> request.params;
        const time = new Date(decodeURIComponent(timeString));

        const cacheKey = `/fx/from/${from}/to/${to}/close/time/${timeString}`;
        const cachedResponse = await cache.get<string>(cacheKey);
        if(cachedResponse) {
            return new Response(
                cachedResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=31536000", // 1 year cache
                        ...corsHeaders,
                    },
                },
            );
        }

        try {
            const { time: closingTime, exchangeRate } = await historicalReadableFxStore.getExchangeRateAtClose(
                from,
                to,
                time,
            );
            const jsonResponse = JSON.stringify(<ExchangeRateCloseResponse> { time: closingTime.toISOString(), exchangeRate });
            const response = new Response(
                jsonResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=31536000", // 1 year cache
                        ...corsHeaders,
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, jsonResponse));
            return response;
        } catch(error) {
            return new Response(
                JSON.stringify({ error }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                    }
                }
            );
        }
    });
}
