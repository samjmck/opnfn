import { Router } from "itty-router";
import { YahooFinance } from "../stores/YahooFinance";
import {
	CombinedHistoricalReadableFXStore, CombinedHistoricalReadableStore,
	CombinedReadableFXStore,
	CombinedReadableStore, CombinedSearchStore
} from "../stores/CombinedStore";
import { registerSecuritiesRoutes } from "./securities";
import { registerFxRoutes } from "./fx";
import { registerSearchRoutes } from "./search";
import { KVCache } from "../cache";

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
