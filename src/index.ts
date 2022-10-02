import { YahooFinance } from "./stores/YahooFinance";
import { Router } from "itty-router";
import { CombinedReadableFXStore, CombinedReadableStore } from "./stores/CombinedStore";
import { micToExchange } from "./store";
import { Currency } from "./money.js";

declare const ALPHA_VANTAGE_API_KEY: string;

const yahooFinance = new YahooFinance();

const combinedReadableStore = new CombinedReadableStore([
	yahooFinance,
]);
const combinedReadableFxStore = new CombinedReadableFXStore([
	yahooFinance,
]);

const router = Router();

router.get("/prices/exchange/:mic/security/:ticker/latest", async request => {
	const { mic, ticker } = <{ mic: string, ticker: string }> request.params;
	if(mic === undefined || ticker === undefined) {
		return new Response(null, { status: 422 });
	}
	try {
		const exchange = micToExchange(mic);
		return new Response(JSON.stringify(await combinedReadableStore.get(exchange, ticker)), { status: 202 });
	} catch(error) {
		return new Response(JSON.stringify({ error }), { status: 500 });
	}
});

router.get("/fx/from/:from/to/:to/latest", async request => {
	const { from, to } = <{ from: Currency, to: Currency }> request.params;
	if(from === undefined || to === undefined) {
		return new Response(null, { status: 422 });
	}
	try {
		return new Response(JSON.stringify(await combinedReadableFxStore.getExchangeRate(from, to)), { status: 202 });
	} catch(error) {
		return new Response(JSON.stringify({ error }), { status: 500 });
	}
});

addEventListener("fetch", event => {
	event.respondWith(router.handle(event.request, event));
});
