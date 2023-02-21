# opnfn

opnfn is an open-source REST API for stock exchange data. It attempts to use standardised ISO codes where possible, such as [`MIC`](https://www.iso20022.org/market-identifier-codes) for stock exchanges. The data gets fetched from different sources, opnfn simply attempts to combine and standardise this data. The REST API is described in an [OpenAPI file](/openapi.yml).

## [REST API documentation](https://opnfn.com)

## Other documentation

1. [Running locally](docs/run-locally.md)
2. [Testing](docs/testing.md)
3. [Performance](docs/performance.md)

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


