import { ReadableStore } from "../store";
import { Currency, moneyAmountStringToInteger } from "../money";
import { Exchange } from "../exchange";

function getCompatibleExchangeSuffix(exchange: Exchange) {
    switch(exchange) {
        case Exchange.EuronextBrussels:
            return "BR";
        case Exchange.EuronextParis:
            return "PA";
        case Exchange.SIXSwissExchange:
            return "SM"; // Not functional
        case Exchange.NYSE:
            return "";
        case Exchange.Nasdaq:
            return "";
        case Exchange.Xetra:
            return "DE";
        case Exchange.BorseFrankfurt:
            return "F"; // For FRA and ETR
        case Exchange.NasdaqHelsinki:
            return "HI"; // Not functional
        case Exchange.EuronextAmsterdam:
            return "AMS";
        case Exchange.LondonStockExchange:
            return "LON";
        case Exchange.BorsaItaliana:
            return "MI"; // Not functional
        default:
            return "";
    }
}

// Note: this isn't always correct. A security can be listed in a currency other
// than the currency used in the country of the stock exchange. See LON:PHPD
function getDefaultExchangeCurrency(exchange: Exchange): Currency {
    switch(exchange) {
        case Exchange.EuronextBrussels:
            return Currency.EUR;
        case Exchange.EuronextParis:
            return Currency.EUR;
        case Exchange.SIXSwissExchange:
            return Currency.CHF;
        case Exchange.NYSE:
            return Currency.USD;
        case Exchange.Nasdaq:
            return Currency.USD;
        case Exchange.BorseFrankfurt:
            return Currency.EUR;
        case Exchange.NasdaqHelsinki:
            return Currency.EUR;
        case Exchange.EuronextAmsterdam:
            return Currency.EUR;
        case Exchange.LondonStockExchange:
            return Currency.GBX;
        case Exchange.BorsaItaliana:
            return Currency.EUR;
        default:
            return Currency.USD;
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

interface GlobalQuoteResponse {
    "Global Quote": {
        "01. symbol":             string;
        "02. open":               string;
        "03. high":               string;
        "04. low":                string;
        "05. price":              string;
        "06. volume":             string;
        "07. latest trading day": string;
        "08. previous close":     string;
        "09. change":             string;
        "10. change percent":     string;
    };
}

// Limit of 5 requests per minute, 500 requests per day
// If you use the full 5 requests per minute, you will reach
// the limit in 100 minutes
// Currently, GHC has 68 securities in portfolio
// 500/68 = 7 requests per day per security
export class AlphaVantage implements ReadableStore {
    constructor(private apiKey: string) {}

    async getByTicker(
        exchange: Exchange,
        ticker: string,
    ) {
        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formatSymbol(exchange, ticker)}&apikey=${this.apiKey}`);
        const json = <GlobalQuoteResponse> (await response.json());
        return {
            currency: getDefaultExchangeCurrency(exchange),
            amount: moneyAmountStringToInteger(json["Global Quote"]["05. price"]),
        };
    }
}
