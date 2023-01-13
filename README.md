# opnfn

opnfn is an open-source REST API for stock exchange data. It attempts to use standardised ISO codes where possible, such as [`MIC`](https://www.iso20022.org/market-identifier-codes) for stock exchanges. The data gets fetched from different sources, opnfn simply attempts to combine and standardise this data. The REST API is described in an [OpenAPI file](/openapi.yml).

## [REST API documentation](https://opnfn.com)

## Performance

The server is hosted by Cloudflare Worker which means heavy load shouldn't be an issue. However, if many requests are made in a short period of time for data that isn't cached, the API that is being used to fetch the data might block the requests. At the moment, there aren't enough users for this to be a problem.

Caching is done by Cloudflare Workers KV, which is a key-value store. Data which should never change is cached forever, such as [historical prices for securities](src/routes/securities.ts#L116) or [historical exchange rates in a specific time period](src/routes/fx.ts#L83). Data that might change is cached for a short period of time, such as the [search results](src/routes/search.ts#L55) for a specific query.

## Demo

### See which stock exchanges have listed Apple

```shell
curl 'https://opnfn.com/v1/search?query=Apple'
```

Response
```json
[
  {
    "name": "Apple Inc.",
    "ticker": "AAPL",
    "exchange": "XNAS"
  },
  {
    "name": "Apple Inc.",
    "ticker": "APC",
    "exchange": "XETR"
  },
  {
    "name": "Apple Inc.",
    "ticker": "AAPL",
    "exchange": "XMEX"
  }
]
```

### Fetch Apple's stock price on the NASDAQ between 2020-08-27 and 2020-09-04

Note that the date formats should follow [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601): see the [documentation](https://opnfn.readme.io/reference/get_prices-exchange-mic-ticker-ticker-period-start-start-end-end) for this endpoint. However, anything supported by the JavaScript [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) parser will also be supported in opnfn.

```shell
curl 'https://opnfn.com/v1/prices/exchange/XNAS/ticker/AAPL/period/start/2020-08-27/end/2020-09-04'
```

Response
```json
{
  "currency": "USD",
  "prices": [
    {
      "time": "2020-08-27T00:00:00.000Z",
      "open": 127.14,
      "high": 127.48,
      "low": 123.83,
      "close": 125.01
    },
    {
      "time": "2020-08-28T00:00:00.000Z",
      "open": 126.01,
      "high": 126.44,
      "low": 124.57,
      "close": 124.8
    },
    {
      "time": "2020-08-31T00:00:00.000Z",
      "open": 127.58,
      "high": 130.99,
      "low": 125.99,
      "close": 129.03
    },
    {
      "time": "2020-09-01T00:00:00.000Z",
      "open": 132.75,
      "high": 134.8,
      "low": 130.52,
      "close": 134.17
    },
    {
      "time": "2020-09-02T00:00:00.000Z",
      "open": 137.58,
      "high": 137.97,
      "low": 126.99,
      "close": 131.39
    },
    {
      "time": "2020-09-03T00:00:00.000Z",
      "open": 126.91,
      "high": 128.83,
      "low": 120.49,
      "close": 120.87
    },
    {
      "time": "2020-09-04T00:00:00.000Z",
      "open": 120.06,
      "high": 123.69,
      "low": 110.88,
      "close": 120.95
    }
  ]
}
```

### Why Vitest?

Initially, I was planning on using Jest for the unit tests. However, Jest required a fair amount of configuration to get it to work with TypeScript. More specifically, it requires Babel. I am trying to keep this project as bloat-free and minimal as possible which is why I ultimately decided against using Jest. 

Another interesting route I experimented with was writing the tests with Deno. The codebase utilises web APIs when possible instead of npm libraries, so the vast majority of functions used are also available in the Deno standard library. Deno's testing library also doesn't require any special configuration meaning it was a potential fit for this project. However, Deno code requires explicitly naming file extensions in `import` statements. Doing this broke `tsc` which in turn broke `wrangler`. On top of that, using Deno and Node in the same project is a bit clunky. 


