## Quick decision tree

- "Best arb / what to trade / compare exchanges for ticker X" → `find_arbitrage_strategies`
- "How has rate evolved on exchange Y" → `get_historical_funding`
- "Current rate of X on Y" → `get_historical_funding` with `periodDays: 1`, take the most recent point
- "Which exchanges are supported" → `list_exchanges`
- Auth/quota debug → `whoami`
