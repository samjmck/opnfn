# opnfn

opnfn is an open-source REST API for stock exchange data. It attempts to use standardised ISO codes where possible, such as [`MIC`](https://www.iso20022.org/market-identifier-codes) for stock exchanges. The data gets fetched from different sources, opnfn simply attempts to combine and standardise this data. The REST API is described in an [OpenAPI file](/openapi.yml).

## [REST API documentation](https://opnfn.com)

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

### Fetch Apple's stock price on the NASDAQ between 
