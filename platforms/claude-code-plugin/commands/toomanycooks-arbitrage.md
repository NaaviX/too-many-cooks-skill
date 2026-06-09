---
description: Show the top delta-neutral arbitrage strategies right now.
---

Use the `find_arbitrage_strategies` MCP tool with `count: 5`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays: 7`. Render a compact table (Ticker | Long → Short | Profit APR). Mention the liquidity and "rates can flip" caveats.

If the user passes arguments, treat them as a refinement: a number like `10` raises the count, an exchange list like `hyperliquid,lighter` filters via the `exchanges` arg.
