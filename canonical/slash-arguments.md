## Slash-command arguments

When this skill is invoked as a slash command with arguments (`/toomanycooks <action> [args…]`),
dispatch on the first word (case-insensitive); the remaining words are that action's arguments.
Exchange keys are lowercase, tickers UPPERCASE. Personalization defaults still apply; explicit
arguments override them.

| Action | Args | What to run |
|---|---|---|
| `rates` | `<TICKER>` | `get_ticker_markets` — sort by absolute APR desc, surface `suggestedArb`. |
| `arb` | `[count] [exchange,list]` | `find_arbitrage_strategies` (defaults `count: 5`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays: 7`). A number raises `count`; a comma list fills `exchanges`. |
| `best` | `<TICKER>` | `find_strategy_for_ticker` — best long/short pair for that one ticker. |
| `spot` | `[count]` | `find_spot_strategies` — spot/perp cash-and-carry pairs. |
| `simulate` | `<TICKER> <long> <short> [notional] [days]` | `simulate_strategy` (defaults `notional: 10000`, `days: 30`); with a single exchange, `simulate_spot_strategy`. |
| `compare` | `<TICKER> [TICKER…]` | `compare_tickers` (1–20 tickers). |
| `spikes` | `[threshold]` | `get_funding_spikes` — cross-exchange z-score outliers. |
| `extremes` | `[high\|low]` | `get_market_extremes` with `direction` (omit for both ends). |
| `history` | `<exchange> <TICKER> [days]` | `get_historical_funding` (`periodDays` ≤ 30, default 7). |
| `costs` | `<TICKER> <long> <short> [size]` | `get_strategy_execution_cost_history`; `size` is a bucket (`1k`–`100k`, default `10k`); with a single exchange, `get_execution_cost_history`. |
| `exchanges` | — | `list_exchanges` — keys + `supportsRWA`. |
| `tickers` | `[search]` | `list_tickers`. |
| `status` | `[exchange]` | `get_exchange_status` for one venue; `get_platform_stats` without args. |
| `plans` | — | `get_plans`. |
| `whoami` | — | `whoami` — auth debug + quota report. |

Fallbacks:

- **No arguments** — print the action table above in compact form and stop.
- **Unknown first word** — treat the whole input as a natural-language funding question and route
  it through the decision tree instead.
