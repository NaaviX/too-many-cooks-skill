---
description: Compare funding rates for a ticker across exchanges.
---

The user provides a ticker (e.g. `BTC`). Call `get_ticker_markets` with `ticker: "<ticker>"` and surface the response's `suggestedArb` alongside the per-exchange rates sorted by absolute APR descending.

Do NOT use `compare_exchanges_for_ticker` — it's a legacy alias that delegates to `get_ticker_markets` anyway.
