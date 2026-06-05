---
description: Compare funding rates for a ticker across exchanges.
---

The user provides a ticker (e.g. `BTC`). Call `get_ticker_markets` with `ticker: "<TICKER>"` (uppercased) for a DB-backed cross-exchange snapshot. Sort by absolute APR descending, render a compact table, and surface the `suggestedArb` pair if present.

Do NOT use `get_funding_rates` — it hits live exchange APIs and is slower / less reliable.
