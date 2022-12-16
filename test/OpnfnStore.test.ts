import { describe, expect, test } from "vitest";
import { YahooFinance } from "../src/stores/YahooFinance";
import { Interval, SearchResultItem } from "../src/store";
import { Exchange } from "../src/exchange";
import { Currency } from "../src/money";
import { OpnfnStore } from "./OpfnStore";

describe("opnfn REST API", () => {
    const opnfn = new OpnfnStore("http://localhost:8787/v1");

    test("Apple search returns result with 'AAPL' on NASDAQ", async () => {
        const containingApple =
            (results: SearchResultItem[]) =>
                results.some(res => res.ticker === "AAPL" && res.exchange === Exchange.Nasdaq);

        const searchResults = await opnfn.search("Apple")
        expect(searchResults).toSatisfy(containingApple);
    });

    test("exchange rate USD to EUR", async () => {
        const rate = await opnfn.getExchangeRate(Currency.USD, Currency.EUR);
        expect(rate).toBeGreaterThan(0);
    });

    test("exchange rate GBP to GBX", async () => {
        const rate = await opnfn.getExchangeRate(Currency.GBP, Currency.GBX);
        expect(rate).toBe(100);
    });

    test("exchange rate GBX to GBP", async () => {
        const rate = await opnfn.getExchangeRate(Currency.GBX, Currency.GBP);
        expect(rate).toBe(0.01);
    });

    test("historical exchange rate EUR to USD on December 3 2018", async () => {
        const rate = await opnfn.getExchangeRateAtClose(Currency.EUR, Currency.USD, new Date("2018-12-03"));
        expect(rate.exchangeRate).toBe(1.134224);
    });

    test("AAPL closing price on January 6 2022", async () => {
        const price = await opnfn.getAtCloseByTicker(Exchange.Nasdaq, "AAPL", new Date("2022-01-06"), true);
        expect(price).toMatchObject({
            currency: Currency.USD,
            amount: 172_00,
        });
    });

    // should return the price on last trading day i.e. Friday January 7 2022
    test("AAPL closing price on Sunday January 9 2022", async () => {
        const price = await opnfn.getAtCloseByTicker(Exchange.Nasdaq, "AAPL", new Date("2022-01-09"), true);
        expect(price).toMatchObject({
            currency: Currency.USD,
            amount: 172_16,
            time: new Date("2022-01-07"),
        });
    });

    test("AAPL historical prices between July 15 2020 and August 15 2020", async () => {
        const prices = await opnfn.getHistoricalByTicker(
            Exchange.Nasdaq,
            "AAPL",
            new Date("2020-07-15"),
            new Date("2020-08-15"),
            Interval.Day,
            true
        );
        expect([...prices.map.entries()].length).toBe(23);
    });

    test("AAPL original (not adjusted) historical prices between August 28 2020 and August 31 2020", async () => {
        const prices = await opnfn.getHistoricalByTicker(
            Exchange.Nasdaq,
            "AAPL",
            new Date("2020-08-28"),
            new Date("2020-08-31"),
            Interval.Day,
            false
        );
        expect([...prices.map.entries()]).toMatchObject([
            [new Date("2020-08-28"), {close: 499_20}],
            [new Date("2020-08-31"), {close: 129_03}],
        ]);
    });

    test("AAPL stock split historical prices between August 28 2020 and August 31 2020", async () => {
        const prices = await opnfn.getHistoricalByTicker(
            Exchange.Nasdaq,
            "AAPL",
            new Date("2020-08-28"),
            new Date("2020-08-31"),
            Interval.Day,
            true
        );

        expect([...prices.map.entries()]).toMatchObject([
            [new Date("2020-08-28"), {close: 124_80}],
            [new Date("2020-08-31"), {close: 129_03}],
        ]);
    });

    test("AAPL most recent price", async () => {
        const price = await opnfn.getByTicker(Exchange.Nasdaq, "AAPL");

        expect(price.amount).toBeGreaterThan(0);
    });
});
