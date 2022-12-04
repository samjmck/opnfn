import { Router } from "itty-router";
import { YahooFinance } from "../stores/YahooFinance.js";
import {
	CombinedHistoricalReadableFXStore, CombinedHistoricalReadableStore,
	CombinedReadableFXStore,
	CombinedReadableStore, CombinedSearchStore
} from "../stores/CombinedStore.js";
import { registerSecuritiesRoutes } from "./securities.js";
import { registerFxRoutes } from "./fx.js";
import { registerSearchRoutes } from "./search.js";
import { KVCache } from "../cache.js";

declare const OPNFN_KV: KVNamespace;

const cache = new KVCache(OPNFN_KV);

const yahooFinance = new YahooFinance();

const router = Router({ base: "/v1" });

const combinedReadableStore = new CombinedReadableStore([
	yahooFinance,
]);
const combinedHistoricalReadableStore = new CombinedHistoricalReadableStore([
	yahooFinance,
]);
registerSecuritiesRoutes(
	router,
	combinedReadableStore,
	combinedHistoricalReadableStore,
	cache,
);

const combinedReadableFxStore = new CombinedReadableFXStore([
	yahooFinance,
]);
const combinedHistoricalReadableFxStore = new CombinedHistoricalReadableFXStore([
	yahooFinance,
]);
registerFxRoutes(
	router,
	combinedReadableFxStore,
	combinedHistoricalReadableFxStore,
	cache,
);

const combinedSearchStore = new CombinedSearchStore([
	yahooFinance,
]);
registerSearchRoutes(
	router,
	combinedSearchStore,
	cache,
);

addEventListener("fetch", event => {
	event.respondWith(router.handle(event.request, event));
});
