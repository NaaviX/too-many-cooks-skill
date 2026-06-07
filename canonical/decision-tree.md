## Quick decision tree

- "Best arb / what to trade" → `find_arbitrage_strategies`
- "Best arb for ticker X specifically" → `find_strategy_for_ticker`
- "Spot/perp (cash-and-carry) arb" → `find_spot_strategies`
- "Project the PnL of a given pair" → `simulate_strategy` (perp/perp) or `simulate_spot_strategy` (spot/perp)
- "Compare exchanges for ticker X" → `get_ticker_markets` (DB-backed, 1 quota point) or `compare_exchanges_for_ticker`
- "Compare several tickers at once" → `compare_tickers`
- "Highest / lowest funding right now" → `get_market_extremes`
- "What's unusual / outliers right now" → `get_funding_spikes`
- "Snapshot across many exchanges" → `get_aggregated_markets`
- "Which tickers exist (and where)" → `list_tickers`
- "Current rate of X on Y" → `get_market_for_ticker_on_exchange`, or `get_historical_funding` with `periodDays: 1`
- "How has rate evolved on exchange Y" → `get_historical_funding`
- "What will it cost to enter/exit (slippage+fees)" → `get_execution_cost_history` (one leg) or `get_strategy_execution_cost_history` (round-trip pair)
- "Which exchanges are supported" → `list_exchanges`
- "Is the data fresh for exchange Y" → `get_exchange_status`
- "Platform overview / totals" → `get_platform_stats`
- "What plans / pricing / quota limits" → `get_plans`
- Auth/quota debug → `whoami`
