import { Router } from "itty-router";
import {
    CombinedSearchStore
} from "../stores/CombinedStore.js";
import { exchangeToOperatingMic } from "../exchange.js";

export function registerSearchRoutes(
    router: Router,
    combinedSearchStore: CombinedSearchStore,
    cache: Cache,
) {
    router.get("/search", async(request, event) => {
        const cacheKey = new Request((new URL(request.url)).toString(), request);
        let cachedResponse = await cache.match(cacheKey);

        if(cachedResponse) {
            return cachedResponse;
        }

        const { query } = <{ query: string }> request.query;

        try {
            const results = await combinedSearchStore.search(query);
            const resultsExchangeToMic = [];
            for(const result of results) {
                resultsExchangeToMic.push({
                    ...result,
                    exchange: exchangeToOperatingMic(result.exchange),
                });
            }
            const response = new Response(
                JSON.stringify(resultsExchangeToMic),
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "s-max-age=86400",
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, response.clone()));
            return response;
        } catch(error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }
    })
}
