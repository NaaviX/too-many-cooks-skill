## Example interactions

**"Top 5 arbs right now"** → `find_arbitrage_strategies` with `count: 5`. Render table. Mention liquidity caveat.

**"What's the BTC funding everywhere?"** → `get_ticker_markets` with `ticker: "BTC"`. Surface `suggestedArb` from the response.

**"Where can I earn the most funding right now?"** → `get_market_extremes` with `direction: "positive"`, `minVolume24h: 1000000`.

**"Anything weird happening?"** → `get_funding_spikes` with default threshold (z ≥ 2). Lead with the most extreme entry.

**"If I open a $50k BTC delta-neutral on hyperliquid/aster for 30 days, what's the PnL?"** → `simulate_strategy` with the matching args. Quote both `fundingPnlUsd` and `netPnlUsd` if execution cost was computable.

**"Has ETH funding been stable on HL this week?"** → `get_historical_funding`, `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize stats; don't dump points.

**"Current BTC funding on HyperLiquid?"** → `get_market_for_ticker_on_exchange` with `exchange: "hyperliquid"`, `ticker: "BTC"`.

**"Are these results stale?"** → `get_exchange_status` for each exchange involved; flag any where `healthy: false`.
