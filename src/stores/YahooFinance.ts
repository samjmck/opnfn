import {
    GenericSecurityProfile,
    HistoricalReadableFXStore,
    HistoricalReadableStore,
    Interval,
    ReadableFXStore,
    ReadableStore, SearchResultItem, SearchStore, SecurityType,
    Split,
    StockSplitStore
} from "../store";
import { Currency, moneyAmountStringToInteger, OHLC, stringToCurrency } from "../money";
import { Exchange } from "../exchange";

function getSecurityType(quoteType: string): SecurityType {
    switch(quoteType) {
        case "ETF":
            return SecurityType.ETF;
        case "EQUITY":
            return SecurityType.Stock;
        default:
            return SecurityType.Other;
    }
}

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
        case Exchange.BorseStuttgart:
            return "SG";
        case Exchange.BolsaMexicana:
            return "MX";
        case Exchange.TokyoStockExchange:
            return "T";
        case Exchange.LondonStockExchangeIOB:
            return "IL";
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
        case "STU":
            return Exchange.BorseStuttgart;
        case "EBS":
            return Exchange.SIXSwissExchange;
        case "NGM":
            return Exchange.Nasdaq;
        case "PAR":
            return Exchange.EuronextParis;
        case "JPX":
            return Exchange.TokyoStockExchange;
        case "IOB":
            return Exchange.LondonStockExchangeIOB;
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
        if(!response.ok) {
            throw new Error(`YahooFinance search request failed for term "${term}"\n${await response.text()}`);
        }

        const json = <YahooFinanceSearchResponse> (await response.json());
        const results: SearchResultItem[] = [];
        for(const quote of json.quotes) {
            // e.g. AAPL.MX -> AAPL
            let ticker = quote.symbol;
            if(ticker.indexOf(".") > -1) {
                ticker = ticker.split(".")[0];
            }

            if(ticker.length > 10) {
                // Yahoo Finance returns some incorrect ticker name
                continue;
            }

            try {
                results.push({
                    name: quote.longname || quote.shortname,
                    ticker,
                    exchange: searchExchangeResultToExchange(quote.exchange),
                });
            } catch(error) {
                console.error(`Could not convert search exchange result "${quote.exchange}"`);
            }
        }
        return results;
    }

    private async getMainExchangeTickerPair(isin: string): Promise<{exchange: Exchange, ticker: string}> {
        const searchResults = await this.search(isin);
        if (searchResults.length === 0) {
            throw new Error(`No ticker found for ISIN ${isin}`);
        }
        return searchResults[0];
    }

    async getProfile(isin: string) {
        const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${isin}&newsCount=0&listsCount=0`);
        if(!response.ok) {
            throw new Error(`YahooFinance search request failed for ISIN "${isin}"\n${await response.text()}`);
        }

        const json = <YahooFinanceSearchResponse> (await response.json());
        if (json.quotes.length === 0) {
            throw new Error(`Empty search result for ISIN "${isin}"`);
        }

        const securityType = getSecurityType(json.quotes[0].quoteType);
        const baseProfile: GenericSecurityProfile = {
            name: json.quotes[0].longname || json.quotes[0].shortname,
            securityType: getSecurityType(json.quotes[0].quoteType),
        };
        switch(securityType) {
            case SecurityType.Stock:
                return {
                    ...baseProfile,
                    sector: json.quotes[0].sector || "Unknown",
                    industry: json.quotes[0].industry || "Unknown",
                };
            default:
                return baseProfile;
        }
    }

    async getExchangeRate(
        from: Currency,
        to: Currency
    ) {
        let multiplier = 1;
        let adjustedFrom = from;
        if(from === Currency.GBX) {
            adjustedFrom = Currency.GBP;
            multiplier /= 100;
        }
        let adjustedTo = to;
        if(to === Currency.GBX) {
            adjustedTo = Currency.GBP;
            multiplier *= 100;
        }
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${adjustedFrom}${adjustedTo}=X`);
        if(!response.ok) {
            throw new Error(`YahooFinance exchange rate request failed for ${from}${to}\n${await response.text()}`);
        }
        const json = <YahooFinanceQueryResponse> (await response.json());
        return json.chart.result[0].meta.regularMarketPrice * multiplier;
    }

    async getExchangeRateAtClose(
        from: Currency, to: Currency, time: Date
    ) {
        let multiplier = 1;
        let adjustedFrom = from;
        if(from === Currency.GBX) {
            adjustedFrom = Currency.GBP;
            multiplier /= 100;
        }
        let adjustedTo = to;
        if(to === Currency.GBX) {
            adjustedTo = Currency.GBP;
            multiplier *= 100;
        }

        const secondsSinceEpoch = Math.floor(time.valueOf() / 1000);
        const dayAfterSecondsSinceEpoch = secondsSinceEpoch + 24 * 60 * 60;
        // Gives us space if the time is in a weekend or holiday period
        const startSecondsSinceEpoch = secondsSinceEpoch - 24 * 60 * 60 * 31;
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${adjustedFrom}${adjustedTo}=X?period1=${startSecondsSinceEpoch}&period2=${dayAfterSecondsSinceEpoch}&interval=1d&events=history&includeAdjustedClose=true`);
        if(!response.ok) {
            throw new Error(`YahooFinance exchange rate at close request failed for ${from}${to} at ${time}\n${await response.text()}`);
        }
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
            exchangeRate: Number(exchangeRate) * multiplier,
        };
    }

    async getHistoricalExchangeRate(
        from: Currency,
        to: Currency,
        startTime: Date,
        endTime: Date,
        interval: Interval,
    ) {
        let multiplier = 1;
        let adjustedFrom = from;
        if(from === Currency.GBX) {
            adjustedFrom = Currency.GBP;
            multiplier /= 100;
        }
        let adjustedTo = to;
        if(to === Currency.GBX) {
            adjustedTo = Currency.GBP;
            multiplier *= 100;
        }

        const startSecondsSinceEpoch = Math.floor(startTime.valueOf() / 1000);
        const endSecondsSinceEpoch = Math.floor(endTime.valueOf() / 1000) + 24 * 60 * 60;
        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${adjustedFrom}${adjustedTo}=X?period1=${startSecondsSinceEpoch}&period2=${endSecondsSinceEpoch}&interval=1d&events=history&includeAdjustedClose=true`);
        if(!response.ok) {
            throw new Error(`YahooFinance historical exchange rate request failed for ${from}${to}\n${await response.text()}`);
        }
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
            const open = Number(columns[1]) * multiplier;
            const high = Number(columns[1]) * multiplier;
            const low = Number(columns[2]) * multiplier;
            const close = Number(columns[3]) * multiplier;
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
        const startTime = new Date(time.valueOf() - 14 * 24 * 60 * 60 * 1000);
        const historical = await this.getHistoricalByTicker(exchange, ticker, startTime, time, Interval.Day, adjustedForSplits);
        const items = [...historical.map.entries()];
        const lastItem = items[items.length - 1];

        return {
            currency: historical.currency,
            amount: lastItem[1].close,
            time: lastItem[0],
        }
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
        if(!response.ok) {
            throw new Error(`YahooFinance historical prices request failed for ${ticker} ${exchange} ${startTime} ${endTime}\n${await response.text()}`);
        }
        const csv = await response.text();

        const rows = csv.split("\n");
        // Header is rows[0], after that comes data rows
        // Header is Date,Open,High,Low,Close,Adj Close,Volume
        let splits: Split[] = [];
        let sharesMultiplier = 1;
        if(!adjustedForSplits) {
            splits = await this.getExchangeTickerStockSplits(exchange, ticker, startTime, new Date());
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
        if(!response.ok) {
            throw new Error(`YahooFinance get by ticker request failed ${exchange} ${ticker}\n${await response.text()}`);
        }
        const json = <YahooFinanceQueryResponse> (await response.json());
        return {
            currency: stringToCurrency(json.chart.result[0].meta.currency),
            amount: moneyAmountStringToInteger(`${json.chart.result[0].meta.regularMarketPrice}`),
        };
    }

    private async getExchangeTickerStockSplits(
        exchange: Exchange,
        ticker: string,
        startTime: Date,
        endTime: Date,
    ): Promise<Split[]> {
        const secondsSinceEpoch = Math.floor(startTime.valueOf() / 1000);
        const endSecondsSinceEpoch = Math.floor(endTime.valueOf() / 1000);

        const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/download/${formatSymbol(exchange, ticker)}?period1=${secondsSinceEpoch}&period2=${endSecondsSinceEpoch}&interval=1d&events=split&includeAdjustedClose=true`);
        if(!response.ok) {
            throw new Error(`YahooFinance get stock splits request ${startTime} ${endTime} ${exchange} ${ticker}\n${await response.text()}`);
        }
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

    async getStockSplits(
        isin: string,
        startTime: Date,
        endTime: Date,
    ): Promise<Split[]> {
        const { exchange, ticker } = await this.getMainExchangeTickerPair(isin);

        return this.getExchangeTickerStockSplits(exchange, ticker, startTime, endTime);
    }

    async getStockSplitTotalMultiplier(
        isin: string,
        since: Date,
    ): Promise<number> {
        const splits = await this.getStockSplits(isin, since, new Date());
        let multiplier = 1;
        for(const { split: splitMultiplier } of splits) {
            multiplier *= splitMultiplier;
        }
        return multiplier;
    }
}
