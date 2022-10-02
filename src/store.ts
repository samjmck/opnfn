import { Currency, Money } from "./money";

export enum Exchange {
    NYSE,
    NYSEArca,
    Nasdaq,
    NasdaqHelsinki,
    NasdaqStockholm,
    NasdaqCopenhagen,
    LuxembourgStockExchange,
    LondonStockExchange,
    EuronextAmsterdam,
    EuronextBrussels,
    EuronextDublin,
    EuronextLisbon,
    EuronextOslo,
    EuronextParis,
    EuronextMilan,
    ViennaStockExchange,
    AthensStockExchange,
    BolsaDeMadrid,
    BorsaItaliana,
    Xetra,
    SIXSwissExchange,
    KoreaExchange,
    BorseFrankfurt,
    BudapestStockExchange,
    PragueStockExchange,
    BorsaInstanbul,
    WarsawStockExchange,
    TaiwanStockExchange,
    OTC,
    MutualFund,
    TorontoStockExchange,
}

export function micToExchange(mic: string): Exchange {
    switch(mic) {
        case "XYNS":
            return Exchange.NYSE;
        case "XNAS":
            return Exchange.Nasdaq;
        case "XAMS":
            return Exchange.EuronextAmsterdam;
        case "XBRU":
            return Exchange.EuronextBrussels;
        case "XMSM":
            return Exchange.EuronextDublin;
        case "XLIS":
            return Exchange.EuronextLisbon;
        case "XMIL":
            return Exchange.EuronextMilan;
        case "XOSL":
            return Exchange.EuronextOslo;
        case "XPAR":
            return Exchange.EuronextParis;
        case "XLON":
            return Exchange.LondonStockExchange;
        case "XTSE":
            return Exchange.TorontoStockExchange;
        case "XSWX":
            return Exchange.SIXSwissExchange;
        case "XFRA":
            return Exchange.BorseFrankfurt;
        case "XCSE":
            return Exchange.NasdaqCopenhagen;
        case "XSTO":
            return Exchange.NasdaqStockholm;
        case "XHEL":
            return Exchange.NasdaqHelsinki;
        default:
            throw new Error("could not find exchange");
    }
}

function stringToExchange(exchange: string): Exchange {
    switch(exchange) {
        case "Euronext Amsterdam":
            return Exchange.EuronextAmsterdam;
        case "Euronext Brussels":
            return Exchange.EuronextBrussels;
        case "Nasdaq":
            return Exchange.Nasdaq;
        case "NYSE":
            return Exchange.NYSE;
        case "Euronext Milan":
            return Exchange.EuronextMilan;
        case "Euronext Paris":
            return Exchange.EuronextParis;
        case "Nasdaq Copenhagen":
            return Exchange.NasdaqCopenhagen;
        case "London Stock Exchange":
            return Exchange.LondonStockExchange;
        case "XETRA":
            return Exchange.Xetra;
        case "OTC":
            return Exchange.OTC;
        case "Nasdaq Helsinki":
            return Exchange.NasdaqHelsinki;
        case "SIX Swiss Exchange":
            return Exchange.SIXSwissExchange;
        case "Borse Frankfurt":
            return Exchange.BorseFrankfurt;
        default:
            return Exchange.OTC;
    }
}

export interface HistoricalReadableStore {
    // Time = milliseconds since UNIX epoch (Date.now())
    getAtClose(exchange: Exchange, ticker: string, time: number): Promise<Money>;
    getAtCloseInPeriod(exchange: Exchange, ticker: string, from: number, to: number): Promise<Money>;
}

export interface ReadableStore {
    get(exchange: Exchange, ticker: string): Promise<Money>;
}

export interface ReadableFXStore {
    getExchangeRate(from: Currency, to: Currency): Promise<number>;
}

export interface HistoricalReadableFXStore {
    getExchangeRateAtClose(from: Currency, to: Currency, time: number): Promise<number>;
}

export interface StockSplitStore {
    getStockSplitTotalMultiplier(since: number, exchange: Exchange, ticker: string): Promise<number>;
}
