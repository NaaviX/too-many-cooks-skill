## Quick decision tree

- "What's interesting / anomalies / outliers right now" → `get_funding_spikes`
- "Best arb / what to trade" → `find_arbitrage_strategies` (top-N) or `find_strategy_for_ticker` (one symbol)
- "Compare ticker X across exchanges" → `get_ticker_markets`
- "Show me everything / market overview" → `get_aggregated_markets` or `get_platform_stats`
- "Top/bottom funding rates" → `get_market_extremes`
- "Which exchanges list ticker X / autocomplete" → `list_tickers`
- "How has rate evolved on exchange Y" → `get_historical_funding`
- "Current rate of X on Y" → `get_market_for_ticker_on_exchange`
- "Project PnL for a chosen pair" → `simulate_strategy`
- "Spot/perp arbitrage" → `find_spot_strategies`
- "Is this exchange's data fresh" → `get_exchange_status`
- "Which exchanges are supported" → `list_exchanges`
- Auth/quota debug → `whoami`
