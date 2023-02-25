import { corsHeaders } from "./cors";
import { StockSplitStore } from "../store";
import { Router } from "itty-router";
import { micToExchange } from "../exchange";

export type StockSplitsResponse = {
    time: string;
    split: number;
}[];

export function registerStockSplitsRoute(
    router: Router,
    stockSplitStore: StockSplitStore,
) {
    router.get("/stock_splits/exchange/:mic/ticker/:ticker/start/:startTime/end/:endTime", async(request, event) => {
        const { mic, ticker, startTime: startTimeString, endTime: endTimeString } = <{ mic: string, ticker: string, startTime: string, endTime: string }> request.params;
        const startTime = new Date(decodeURIComponent(startTimeString));
        const endTime = new Date(decodeURIComponent(endTimeString));

        try {
            const stockSplits = await stockSplitStore.getStockSplits(startTime, endTime, micToExchange(mic), ticker);
            const stockSplitsResponse: StockSplitsResponse = [];
            for(const stockSplit of stockSplits) {
                stockSplitsResponse.push({
                    time: stockSplit.time.toISOString(),
                    split: stockSplit.split,
                });
            }
            return new Response(
                JSON.stringify(stockSplitsResponse),
                {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders,
                    },
                },
            );
        } catch(error) {
            console.log(error);
            return new Response(
                JSON.stringify({ error }),
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
