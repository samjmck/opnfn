import { ProfileStore, SecurityType } from "../store";
import { Router } from "itty-router";
import { Cache } from "../cache";
import { corsHeaders } from "./cors";

export type ProfileResponse = {
    name: string;
    securityType: SecurityType;
    sector?: string;
    industry?: string;
};

export function registerProfileRoute(
    router: Router,
    profileStore: ProfileStore,
    cache: Cache,
) {
    router.get("/profiles/isin/:isin", async (request, event) => {
        const {isin} = <{ isin: string }>request.params;

        const cacheKey = `/profiles/isin/${isin}`;
        const cachedResponse = await cache.get<string>(cacheKey);
        if (cachedResponse) {
            return new Response(
                cachedResponse,
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                },
            );
        }

        try {
            const profile = await profileStore.getProfile(isin);
            const jsonResponse = JSON.stringify(<ProfileResponse>profile);
            const response = new Response(
                jsonResponse,
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                },
            );
            event.waitUntil(cache.put(cacheKey, jsonResponse));
            return response;
        } catch (error) {
            return new Response(
                JSON.stringify({error}),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                },
            );
        }
    });
}