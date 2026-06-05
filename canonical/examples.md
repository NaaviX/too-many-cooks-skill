## Example interactions

**"Top 5 arbs right now"** → `find_arbitrage_strategies` with `count: 5`. Render table. Mention liquidity caveat.

**"Compare BTC across HL, Lighter, Extended"** → `get_historical_funding` per exchange in parallel (latest point each), or `find_arbitrage_strategies` with `exchanges: ["hyperliquid", "lighter", "extended"]` if they want the long/short pair. **Do not** use `compare_exchanges_for_ticker`.

**"Has ETH funding been stable on HL this week?"** → `get_historical_funding`, `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize stats; don't dump points.

**"Current BTC funding on HyperLiquid?"** → `get_historical_funding`, `tickers: ["BTC"]`, `periodDays: 1`. Take latest point. **Do not** use `get_funding_rates`.

**"What's an arbitrage strategy?"** → Explain the long-low/short-high mechanic. Optionally call `find_arbitrage_strategies` with `count: 3` to ground the explanation.
