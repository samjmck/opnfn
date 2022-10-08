import { Router } from "itty-router";
import { CombinedHistoricalReadableFXStore, CombinedReadableFXStore } from "../stores/CombinedStore.js";
import { Interval } from "../store.js";
import { Currency, OHLC } from "../money.js";

export function registerFxRoutes(
    router: Router,
    combinedReadableFxStore: CombinedReadableFXStore,
    combinedHistoricalReadableFxStore: CombinedHistoricalReadableFXStore,
) {
    router.get("/fx/from/:from/to/:to/latest", async request => {
        const { from, to } = <{ from: Currency, to: Currency }> request.params;
        if(from === undefined || to === undefined) {
            return new Response(null, { status: 422 });
        }
        try {
            return new Response(
                JSON.stringify(await combinedReadableFxStore.getExchangeRate(from, to)),
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

    router.get("/fx/from/:from/to/:to/historical", async request => {
        const { from, to } = <{ from: Currency, to: Currency }> request.params;
        if(from === undefined || to === undefined) {
            return new Response(null, { status: 422 });
        }
        const { startTime: startTimeString, endTime: endTimeString, interval } =
            <{ startTime: string, endTime: string, interval?: Interval }> request.query;
        if(startTimeString === undefined || endTimeString === undefined) {
            return new Response(null, { status: 422 });
        }
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
            const prices: ({ time: string } & OHLC)[] = [];
            for(const [time, ohlc] of historicalPriceMap) {
                prices.push({
                    time: time.toISOString(),
                    ...ohlc,
                });
            }
            return new Response(
                JSON.stringify({ prices }),
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        } catch(error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }
    });
}
