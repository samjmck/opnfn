import { Router } from "itty-router";
import { YahooFinance } from "../stores/YahooFinance";
import {
	CombinedHistoricalReadableFXStore, CombinedHistoricalReadableStore, CombinedProfileStore,
	CombinedReadableFXStore,
	CombinedReadableStore, CombinedSearchStore, CombinedStockSplitStore
} from "../stores/CombinedStore";
import { registerPricingRoutes } from "./pricing";
import { registerFxRoutes } from "./fx";
import { registerSearchRoutes } from "./search";
import { KVCache } from "../cache";
import { registerStockSplitsRoute } from "./stock-splits";
import { registerProfileRoute } from "./profile";

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
registerPricingRoutes(
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

const combinedProfileStore = new CombinedProfileStore([
	yahooFinance,
]);
registerProfileRoute(
	router,
	combinedProfileStore,
	cache,
);

const combinedStockSplitStore = new CombinedStockSplitStore([
	yahooFinance,
]);
registerStockSplitsRoute(
	router,
	combinedStockSplitStore,
);

addEventListener("fetch", event => {
	event.respondWith(router.handle(event.request, event));
});
