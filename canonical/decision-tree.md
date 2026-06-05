## Quick decision tree

- "Best arb / what to trade" → `find_arbitrage_strategies`
- "Compare exchanges for ticker X" → `get_ticker_markets` (DB-backed, 1 quota point) or `compare_exchanges_for_ticker`
- "How has rate evolved on exchange Y" → `get_historical_funding`
- "Current rate of X on Y" → `get_historical_funding` with `periodDays: 1`, take the most recent point
- "Which exchanges are supported" → `list_exchanges`
- Auth/quota debug → `whoami`
