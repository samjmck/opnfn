import { YahooFinance } from "./stores/YahooFinance";
import { Router } from "itty-router";
import {
	CombinedHistoricalReadableStore,
	CombinedReadableFXStore,
	CombinedReadableStore
} from "./stores/CombinedStore";
import { Interval, micToExchange } from "./store";
import { Currency, Money } from "./money.js";

declare const ALPHA_VANTAGE_API_KEY: string;

const yahooFinance = new YahooFinance();

const combinedReadableStore = new CombinedReadableStore([
	yahooFinance,
]);
const combinedHistoricalReadableStore = new CombinedHistoricalReadableStore([
	yahooFinance,
])
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
		return new Response(
			JSON.stringify(await combinedReadableStore.get(exchange, ticker)),
			{
				status: 202,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	} catch(error) {
		return new Response(
			JSON.stringify({ error }),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
});

router.get("/prices/exchange/:mic/security/:ticker/historic", async request => {
	const { mic, ticker } = <{ mic: string, ticker: string }> request.params;
	if(mic === undefined || ticker === undefined) {
		return new Response(null, { status: 422 });
	}
	const { startTime: startTimeString, endTime: endTimeString, interval, adjustedForStockSplits: adjustedForStockSplitsString } =
		<{ startTime: string, endTime: string, interval?: Interval, adjustedForStockSplits: string }> request.query;
	if(startTimeString === undefined || endTimeString === undefined) {
		return new Response(null, { status: 422 });
	}
	const startTime = Number(startTimeString);
	const endTime = Number(endTimeString);
	try {
		const exchange = micToExchange(mic);
		const historicalPriceMap = await combinedHistoricalReadableStore.getAtCloseInPeriod(
			exchange,
			ticker,
			startTime,
			endTime,
			interval || Interval.Day,
			adjustedForStockSplitsString === "true" || adjustedForStockSplitsString === undefined,
		);
		const datePricePairs: [number, Money][] = [];
		for(const [time, value] of historicalPriceMap) {
			datePricePairs.push([time, value]);
		}
		return new Response(
			JSON.stringify(datePricePairs),
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

addEventListener("fetch", event => {
	event.respondWith(router.handle(event.request, event));
});
