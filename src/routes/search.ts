import { Router } from "itty-router";
import { exchangeToOperatingMic } from "../exchange";
import { SearchStore } from "../store";
import { Cache } from "../cache.js";

export function registerSearchRoutes(
    router: Router,
    searchStore: SearchStore,
    cache: Cache,
) {
    router.get("/search", async(request, event) => {
        const { query } = <{ query: string }> request.query;

        const cacheKey = `/search?query=${query}`;
        const cachedResponse = await cache.get<string>(cacheKey);
        if(cachedResponse) {
            return new Response(
                cachedResponse,
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        try {
            const searchResults = await searchStore.search(query);

            // Same results only with the exchange field being the exchange MIC
            const resultsWithMics = [];
            for(const searchResult of searchResults) {
                resultsWithMics.push({
                    ...searchResult,
                    exchange: exchangeToOperatingMic(searchResult.exchange),
                });
            }

            const jsonResults = JSON.stringify(resultsWithMics);
            const response = new Response(
                jsonResults,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=86400",
                    },
                },
            );

            // If the result is not empty, cache the response
            if(searchResults.length > 0) {
                // Cache time of 1 day because sometimes securities can be delisted or renamed
                event.waitUntil(cache.put(cacheKey, jsonResults, 86400));
            }

            return response;
        } catch(error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }
    })
}
