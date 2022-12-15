import { ReadableStore } from "../store";
import { moneyAmountStringToInteger, stringToCurrency } from "../money";
import { Exchange } from "../exchange";

function getCompatibleExchangeSuffix(exchange: Exchange) {
    switch(exchange) {
        case Exchange.EuronextBrussels:
            return "EBR";
        case Exchange.EuronextParis:
            return "EPA";
        case Exchange.SIXSwissExchange:
            return "SWX";
        case Exchange.NYSE:
            return "NYSE";
        case Exchange.Nasdaq:
            return "NASDAQ";
        case Exchange.Xetra:
            return "ETR";
        case Exchange.BorseFrankfurt:
            return "FRA";
        case Exchange.NasdaqHelsinki:
            return "HEL";
        case Exchange.EuronextAmsterdam:
            return "AMS";
        case Exchange.LondonStockExchange:
            return "LON";
        case Exchange.BorsaItaliana:
        case Exchange.EuronextMilan:
            return "BIT";
        case Exchange.NasdaqCopenhagen:
            return "CPH";
        case Exchange.OTC:
            return "OTCMKTS";
        case Exchange.MutualFund:
            return "MUTF";
        default:
            return "";
    }
}

function toKey(exchange: Exchange, ticker: string) {
    return `${ticker}:${getCompatibleExchangeSuffix(exchange)}`;
}

export class GoogleFinance implements ReadableStore {
    async getByTicker(
        exchange: Exchange,
        ticker: string,
    ) {
        const response = await fetch(`https://www.google.com/finance/quote/${ticker}:${getCompatibleExchangeSuffix(exchange)}`);

        const html = await response.text();
        const priceStrings = html.match(/(?<=YMlKec fxKbKc">)(?:\D*)(.+?)(?=<\/div)/);
        if(priceStrings === null) {
            throw new Error(`could not find a price in Google Finance page`);
        }
        const currencyCodeStrings = html.match(/(?<=data-currency-code=")(.+?)(?=")/g);
        if(currencyCodeStrings === null) {
            throw new Error("could not find currency code");
        }

        return {
            currency: stringToCurrency(currencyCodeStrings[0]),
            amount: moneyAmountStringToInteger(priceStrings[1]),
        };
    }
}
