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
    BolsaMexicana,
    BorsaItaliana,
    Xetra,
    SIXSwissExchange,
    KoreaExchange,
    BorseFrankfurt,
    BorseBerlin,
    BudapestStockExchange,
    PragueStockExchange,
    BorsaIstanbul,
    WarsawStockExchange,
    TaiwanStockExchange,
    OTC,
    MutualFund,
    TorontoStockExchange,
    NEOExchange,
}

export function exchangeToOperatingMic(exchange: Exchange): string {
    switch (exchange) {
        case Exchange.NYSE:
            return "XNYS";
        case Exchange.NYSEArca:
            return "XNYS";
        case Exchange.Nasdaq:
            return "XNAS";
        case Exchange.NasdaqHelsinki:
            return "XHEL";
        case Exchange.NasdaqStockholm:
            return "XSTO";
        case Exchange.LuxembourgStockExchange:
            return "XLUX";
        case Exchange.LondonStockExchange:
            return "XLON";
        case Exchange.EuronextAmsterdam:
            return "XAMS";
        case Exchange.EuronextBrussels:
            return "XBRU";
        case Exchange.EuronextDublin:
            return "XMSM";
        case Exchange.EuronextLisbon:
            return "XLIS";
        case Exchange.EuronextOslo:
            return "XOSL";
        case Exchange.EuronextParis:
            return "XPAR";
        case Exchange.EuronextMilan:
            return "XMIL";
        case Exchange.ViennaStockExchange:
            return "XWBO";
        case Exchange.AthensStockExchange:
            return "ASEX";
        case Exchange.BolsaDeMadrid:
            return "BMEX";
        case Exchange.BolsaMexicana:
            return "XMEX";
        case Exchange.BorsaItaliana:
            return "XMIL";
        case Exchange.Xetra:
            return "XETR";
        case Exchange.SIXSwissExchange:
            return "XSWX";
        case Exchange.BorseFrankfurt:
            return "XFRA";
        case Exchange.BorseBerlin:
            return "XBER";
        case Exchange.BudapestStockExchange:
            return "XBUD";
        case Exchange.PragueStockExchange:
            return "XPRA";
        case Exchange.BorsaIstanbul:
            return "XIST";
        case Exchange.WarsawStockExchange:
            return "XWAR";
        case Exchange.TaiwanStockExchange:
            return "XTAI";
        case Exchange.OTC:
            return "LOTC";
        case Exchange.TorontoStockExchange:
            return "XTSE";
        case Exchange.NEOExchange:
            return "NEOE";
        case Exchange.KoreaExchange:
            return "XKRX";
        default:
            throw new Error(`could not get MIC of "${exchange}"`);
    }
}

export function micToExchange(mic: string): Exchange {
    switch (mic) {
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
        case "XKRX":
            return Exchange.KoreaExchange;
        default:
            throw new Error("could not find exchange");
    }
}

function stringToExchange(exchange: string): Exchange {
    switch (exchange) {
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
