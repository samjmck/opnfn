import { Router } from "itty-router";
import { YahooFinance } from "../stores/YahooFinance.js";
import {
	CachedCombinedHistoricalReadableFXStore,
	CachedCombinedHistoricalReadableStore, CombinedHistoricalReadableFXStore, CombinedHistoricalReadableStore,
	CombinedReadableFXStore,
	CombinedReadableStore, CombinedSearchStore
} from "../stores/CombinedStore.js";
import { registerSecuritiesRoutes } from "./securities.js";
import { registerFxRoutes } from "./fx.js";
import { registerSearchRoutes } from "./search.js";

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
	caches.default,
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
	caches.default,
);

const combinedSearchStore = new CombinedSearchStore([
	yahooFinance,
]);
registerSearchRoutes(
	router,
	combinedSearchStore,
	caches.default,
);

addEventListener("fetch", event => {
	event.respondWith(router.handle(event.request, event));
});
