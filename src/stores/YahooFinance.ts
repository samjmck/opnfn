import {
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    Interval,
    ReadableFXStore,
    ReadableStore, SearchResultItem, SearchStore,
    Split,
    StockSplitStore
} from "../store.js";
import { Currency, moneyAmountStringToInteger, OHLC, stringToCurrency } from "../money";
import { Exchange } from "../exchange.js";

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
        case Exchange.BorseBerlin:
            return "BE";
        case Exchange.KoreaExchange:
            return "KSC"
        default:
            return "";
    }
}

function searchExchangeResultToExchange(exchange: string): Exchange {
    switch(exchange) {
        case "BRU":
            return Exchange.EuronextBrussels;
        case "MIL":
            return Exchange.EuronextMilan;
        case "LSE":
            return Exchange.LondonStockExchange;
        case "NMS":
            return Exchange.Nasdaq;
        case "NYQ":
            return Exchange.NYSE;
        case "PNK":
            return Exchange.OTC;
        case "AMS":
            return Exchange.EuronextAmsterdam;
        case "HEL":
            return Exchange.NasdaqHelsinki;
        case "GER":
            return Exchange.Xetra;
        case "CPH":
            return Exchange.NasdaqCopenhagen;
        case "BER":
            return Exchange.BorseBerlin;
        case "MEX":
            return Exchange.BolsaMexicana;
        case "NEO":
            return Exchange.NEOExchange;
        case "FRA":
            return Exchange.BorseFrankfurt;
        case "KSC":
            return Exchange.KoreaExchange;
        default:
            throw new Error(`could not find exchange for Yahoo Finance search result exchange "${exchange}"`);
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

interface YahooFinanceSearchResponse {
    quotes: {
        exchange: string;
        shortname: string;
        quoteType: string;
        symbol: string;
        index: string;
        score: number;
        typeDisp: string;
        longname: string;
        exchDisp: string;
        sector: string;
        industry: string;
        dispSecIndFlag: boolean;
        isYahooFinance: boolean;
    }[];
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
    SearchStore,
    ReadableStore,
    ReadableFXStore,
    HistoricalReadableStore,
    HistoricalReadableFXStore,
    StockSplitStore
{
    async search(term: string) {
        const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${term}&newsCount=0&listsCount=0`);
        const json = <YahooFinanceSearchResponse> (await response.json());
        console.log(JSON.stringify(json, null, 4));
        const results: SearchResultItem[] = [];
        for(const quote of json.quotes) {

            // e.g. AAPL.MX -> AAPL
            let ticker = quote.symbol;
            if(ticker.indexOf(".") > -1) {
                ticker = ticker.split(".")[0];
            }

            results.push({
                name: quote.longname || quote.shortname,
                ticker,
                exchange: searchExchangeResultToExchange(quote.exchange),
            });
        }
        return results;
    }

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
        from: Currency, to: Currency, time: Date
    ) {
        const secondsSinceEpoch = Math.floor(time.valueOf() / 1000);
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
        while(Date.parse(rows[rowIndex].split(",")[0]) > time.valueOf()) {
            rowIndex -= 1;
        }
        const dataRow = rows[rowIndex];
        const dataColumns = dataRow.split(",");
        const exchangeRate = dataColumns[4];
        return {
            time: new Date(rows[rowIndex].split(",")[0]),
            rate: Number(exchangeRate)
        };
    }

    async getHistoricalExchangeRate(
        from: Currency,
        to: Currency,
        startTime: Date,
        endTime: Date,
        interval: Interval,
    ) {
        const startSecondsSinceEpoch = Math.floor(startTime.valueOf() / 1000);
        const endSecondsSinceEpoch = Math.floor(endTime.valueOf() / 1000) + 24 * 60 * 60;
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${from}${to}=X?period1=${startSecondsSinceEpoch}&period2=${endSecondsSinceEpoch}&interval=1d&events=history&includeAdjustedClose=true`);
        const csv = await response.text();

        const rows = csv.split("\n");
        // Header is rows[0], after that comes data rows
        // Header is Date,Open,High,Low,Close,Adj Close,Volume
        const historicPriceMap = new Map<Date, OHLC>();
        for(const row of rows.slice(1)) {
            if(row === "") {
                break;
            }
            const columns = row.split(",");
            const time = new Date(columns[0]);
            if(time.valueOf() < startTime.valueOf()) {
                continue;
            }
            if(time.valueOf() > endTime.valueOf()) {
                break;
            }
            const open = Number(columns[1]);
            const high = Number(columns[1]);
            const low = Number(columns[2]);
            const close = Number(columns[3]);
            historicPriceMap.set(time, {
                open,
                high,
                low,
                close,
            });
        }

        return historicPriceMap;
    }

    async getAtCloseByTicker(
        exchange: Exchange,
        ticker: string,
        time: Date,
        adjustedForSplits: boolean,
    ) {
        // + 14 days
        const endTime = new Date(time.valueOf() + 14 * 24 * 60 * 60 * 1000);
        const historical = await this.getHistoricalByTicker(exchange, ticker, time, endTime, Interval.Day, adjustedForSplits);
        const [firstTime, ohlc] = <[Date, OHLC]> historical.map.entries().next().value;
        return {
            time: firstTime,
            currency: historical.currency,
            amount: ohlc.close,
        };
    }

    async getHistoricalByTicker(
        exchange: Exchange,
        ticker: string,
        startTime: Date,
        endTime: Date,
        interval: Interval,
        adjustedForSplits: boolean,
    ) {
        const startSecondsSinceEpoch = Math.floor(startTime.valueOf() / 1000);
        const endSecondsSinceEpoch = Math.floor(endTime.valueOf() / 1000) + 24 * 60 * 60;
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${formatSymbol(exchange, ticker)}?period1=${startSecondsSinceEpoch}&period2=${endSecondsSinceEpoch}&interval=1d&events=history&includeAdjustedClose=true`);
        const csv = await response.text();

        const rows = csv.split("\n");
        // Header is rows[0], after that comes data rows
        // Header is Date,Open,High,Low,Close,Adj Close,Volume
        let splits: Split[] = [];
        let sharesMultiplier = 1;
        if(!adjustedForSplits) {
            splits = await this.getStockSplits(startTime, new Date(), exchange, ticker);
            for(const { split } of splits) {
                sharesMultiplier *= split;
            }
        }
        const historicPriceMap = new Map<Date, OHLC>();
        for(const row of rows.slice(1)) {
            if(row === "") {
                break;
            }
            const columns = row.split(",");
            const time = new Date(columns[0]);
            if(time.valueOf() < startTime.valueOf()) {
                continue;
            }
            if(time.valueOf() > endTime.valueOf()) {
                break;
            }
            if(splits.length > 0 && splits[0].time.valueOf() <= time.valueOf()) {
                sharesMultiplier /= splits[0].split;
                splits.splice(0, 1);
            }

            const open = Math.floor(moneyAmountStringToInteger(columns[1], ".", 2) * sharesMultiplier);
            const high = Math.floor(moneyAmountStringToInteger(columns[2], ".", 2) * sharesMultiplier);
            const low = Math.floor(moneyAmountStringToInteger(columns[3], ".", 2) * sharesMultiplier);
            const close = Math.floor(moneyAmountStringToInteger(columns[4], ".", 2) * sharesMultiplier);

            historicPriceMap.set(time, {
                open,
                high,
                low,
                close,
            });
        }

        const { currency } = await this.getByTicker(exchange, ticker);

        return {
            currency,
            map: historicPriceMap,
        };
    }

    async getByTicker(
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

    async getStockSplits(
        startTime: Date,
        endTime: Date,
        exchange: Exchange,
        ticker: string,
    ): Promise<Split[]> {
        const secondsSinceEpoch = Math.floor(startTime.valueOf() / 1000);
        const endSecondsSinceEpoch = Math.floor(endTime.valueOf() / 1000);

        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${formatSymbol(exchange, ticker)}?period1=${secondsSinceEpoch}&period2=${endSecondsSinceEpoch}&interval=1d&events=split&includeAdjustedClose=true`);
        const csv = await response.text();

        const splits: Split[] = [];
        // Header is Date,Stock Splits
        // 1992-06-15,3:2
        // 1994-05-23,2:1
        // ...
        const rows = csv.trimEnd().split("\n");
        for(const row of rows.slice(1)) {
            const [date, splitString] = row.split(",");
            const splitNumbers = splitString.split(":");
            splits.push({
                time: new Date(date),
                split: Number(splitNumbers[0]),
            })
        }

        return splits.sort((a, b) => a.time.valueOf() - b.time.valueOf());
    }

    async getStockSplitTotalMultiplier(
        since: Date,
        exchange: Exchange,
        ticker: string,
    ): Promise<number> {
        const splits = await this.getStockSplits(since, new Date(), exchange, ticker);
        let multiplier = 1;
        for(const { split: splitMultiplier } of splits) {
            multiplier *= splitMultiplier;
        }
        return multiplier;
    }
}
