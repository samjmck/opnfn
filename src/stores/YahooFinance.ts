import {
    Exchange,
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    ReadableFXStore,
    ReadableStore, StockSplitStore
} from "../store.js";
import { Currency, moneyAmountStringToInteger, stringToCurrency } from "../money";

function getCompatibleExchangeSuffix(exchange: Exchange) {
    switch(exchange) {
        case Exchange.EuronextBrussels:
            return "BR";
        case Exchange.EuronextParis:
            return "PA";
        case Exchange.SIXSwissExchange:
            return "SW"; // Not functional
        case Exchange.NYSE:
            return "";
        case Exchange.Nasdaq:
            return "";
        case Exchange.Xetra:
            return "DE";
        case Exchange.BorseFrankfurt:
            return "F"; // For FRA and ETR
        case Exchange.NasdaqHelsinki:
            return "HE";
        case Exchange.EuronextAmsterdam:
            return "AS";
        case Exchange.LondonStockExchange:
            return "L";
        case Exchange.BorsaItaliana:
        case Exchange.EuronextMilan:
            return "MI"; // Not functional
        case Exchange.TaiwanStockExchange:
            return "TSRC";
        case Exchange.NasdaqCopenhagen:
            return "CO";
        default:
            return "";
    }
}

function formatSymbol(exchange: Exchange, ticker: string) {
    const exchangeSuffix = getCompatibleExchangeSuffix(exchange);
    // Suffixes for American exchanges such as NYSE don't seem to work. However, it looks
    // like just searching for their tickers works fine. So don't use exchange suffix
    // in that case
    if(exchangeSuffix === "") {
        return ticker;
    } else {
        return `${ticker}.${exchangeSuffix}`;
    }
}

interface YahooFinanceQueryResponse {
    chart: {
        result: {
            meta: {
                currency: string;
                regularMarketPrice: number;
            }
        }[];
    }
}

export class YahooFinance implements
    ReadableStore,
    ReadableFXStore,
    HistoricalReadableStore,
    HistoricalReadableFXStore,
    StockSplitStore
{
    async getExchangeRate(
        from: Currency,
        to: Currency
    ) {
        let multiplier = 1;
        let adjustedFrom = from;
        if(from === Currency.GBX) {
            adjustedFrom = Currency.GBP;
            multiplier *= 100;
        }
        let adjustedTo = to;
        if(to === Currency.GBX) {
            adjustedTo = Currency.GBP;
            multiplier *= 100;
        }
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${adjustedFrom}${adjustedTo}=X`);
        const json = <YahooFinanceQueryResponse> (await response.json());
        return json.chart.result[0].meta.regularMarketPrice * multiplier;
    }

    async getExchangeRateAtClose(
        from: Currency, to: Currency, time: number
    ) {
        const secondsSinceEpoch = Math.floor(time / 1000);
        const dayAfterSecondsSinceEpoch = secondsSinceEpoch + 24 * 60 * 60;
        // Gives us space if the time is in a weekend or holiday period
        const startSecondsSinceEpoch = secondsSinceEpoch - 24 * 60 * 60 * 31;
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${from}${to}=X?period1=${startSecondsSinceEpoch}&period2=${dayAfterSecondsSinceEpoch}&interval=1d&events=history&includeAdjustedClose=true`);
        const csv = await response.text();

        const rows = csv.split("\n");
        // Header is rows[0], after that comes data rows
        // Header is Date,Open,High,Low,Close,Adj Close,Volume

        // Why last row? Imagine you are trying to see the price during a weekend or holiday period. The last row
        // will be the last updated price for that time
        let rowIndex = rows.length - 1;
        while(Date.parse(rows[rowIndex].split(",")[0]).valueOf() > time) {
            rowIndex -= 1;
        }
        const dataRow = rows[rowIndex];
        const dataColumns = dataRow.split(",");
        const exchangeRate = dataColumns[4];
        return Number(exchangeRate);
    }

    async getAtClose(
        exchange: Exchange,
        ticker: string,
        time: number,
    ) {
        const secondsSinceEpoch = Math.floor(time / 1000);
        const dayAfterSecondsSinceEpoch = secondsSinceEpoch + 24 * 60 * 60;
        // Gives us space if the time is in a weekend or holiday period
        const startSecondsSinceEpoch = secondsSinceEpoch - 24 * 60 * 60 * 31;
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${formatSymbol(exchange, ticker)}?period1=${startSecondsSinceEpoch}&period2=${dayAfterSecondsSinceEpoch}&interval=1d&events=history&includeAdjustedClose=true`);
        const csv = await response.text();

        const rows = csv.split("\n");

        // Header is rows[0], after that comes data rows
        // Header is Date,Open,High,Low,Close,Adj Close,Volume

        // Why last row? Imagine you are trying to see the price during a weekend or holiday period. The last row
        // will be the last updated price for that time
        let rowIndex = rows.length - 1;
        while(Date.parse(rows[rowIndex].split(",")[0]).valueOf() > time) {
            rowIndex -= 1;
        }
        const dataRow = rows[rowIndex];
        const dataColumns = dataRow.split(",");
        const priceString = dataColumns[4];
        const amount = moneyAmountStringToInteger(priceString, ".");

        const livePrice = await this.get(exchange, ticker);
        const currency = livePrice.currency;

        return {
            currency,
            amount,
        };
    }

    async get(
        exchange: Exchange,
        ticker: string,
    ) {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${formatSymbol(exchange, ticker)}`);
        const json = <YahooFinanceQueryResponse> (await response.json());
        return {
            currency: stringToCurrency(json.chart.result[0].meta.currency),
            amount: moneyAmountStringToInteger(`${json.chart.result[0].meta.regularMarketPrice}`),
        };
    }

    async getStockSplitTotalMultiplier(
        since: number,
        exchange: Exchange,
        ticker: string,
    ): Promise<number> {
        const secondsSinceEpoch = Math.floor(since / 1000);
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${formatSymbol(exchange, ticker)}?period1=${secondsSinceEpoch}&period2=${Date.now()}&interval=1d&events=split&includeAdjustedClose=true`);
        const csv = await response.text();

        // Header is Date,Stock Splits
        // 1992-06-15,3:2
        // 1994-05-23,2:1
        // ...
        const rows = csv.trimEnd().split("\n");
        let multiplier = 1;
        for(const row of rows.slice(1)) {
            const [date, splitString] = row.split(",");
            const splitNumbers = splitString.split(":");
            multiplier *= Number(splitNumbers[0]) / Number(splitNumbers[1]);
        }

        return multiplier;
    }
}
