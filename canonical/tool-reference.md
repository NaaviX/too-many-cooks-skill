## Tool reference

All tools below are **database-backed** (one request, time-aligned snapshots) except the single `get_funding_rates` exception in the next section.

### Strategy & arbitrage

| Tool | When | Useful args |
|---|---|---|
| `find_arbitrage_strategies` | **Default for arbitrage questions.** | `count`, `exchanges: []`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays` |
| `find_strategy_for_ticker` | Best long/short pair for **one** ticker | `ticker`, `exchanges: []`, `periodDays` |
| `find_spot_strategies` | Spot/perp cash-and-carry pairs | `count`, `exchanges: []`, `periodDays` |
| `simulate_strategy` | Project funding (and net-of-cost) PnL for a perp/perp pair | `ticker`, `longExchange`, `shortExchange`, `notional`, `days`, `periodDays` |
| `simulate_spot_strategy` | Project PnL for a spot/perp pair | `exchange`, `ticker`, `notional`, `days`, `periodDays` |

### Discovery & market data

| Tool | When | Useful args |
|---|---|---|
| `list_exchanges` | Need a valid exchange key, or user asks what's supported | — |
| `list_tickers` | Which tickers exist and on which exchanges | `search`, `marketTypes: []` |
| `get_aggregated_markets` | Cross-exchange snapshot in one call (replaces fan-out) | `exchanges: []`, `tickers: []`, `marketTypes: []`, `minVolume24h`, `limit` |
| `get_market_extremes` | Highest/lowest funding right now | `direction`, `count`, `exchanges: []`, `minVolume24h` |
| `get_funding_spikes` | "What's unusual right now" — cross-exchange z-score outliers | `threshold`, `count`, `minExchanges`, `exchanges: []` |
| `get_ticker_markets` | One ticker across exchanges (includes `suggestedArb`) | `ticker`, `sort`, `minVolume24h` |
| `compare_tickers` | Several tickers across exchanges in one call | `tickers: []`, `sort`, `minVolume24h` |
| `get_market_for_ticker_on_exchange` | Live single market lookup (one ticker, one exchange) | `exchange`, `ticker` |
| `get_historical_funding` | Rate evolution over time, or "current rate" via the latest point | `exchange`, `tickers: []`, `periodDays` |

### Execution costs, status & meta

| Tool | When | Useful args |
|---|---|---|
| `get_execution_cost_history` | Slippage + fees over time for one exchange/ticker | `exchange`, `ticker`, `size`, `periodDays` |
| `get_strategy_execution_cost_history` | Round-trip cost over time for a delta-neutral pair | `longExchange`, `shortExchange`, `ticker`, `size`, `periodDays` |
| `get_exchange_status` | Data freshness for an exchange (last cron write) | `exchange` |
| `get_platform_stats` | Platform overview / totals | — |
| `get_plans` | API plans: quotas, limits, pricing (`-1` = unlimited) | — |
| `whoami` | Auth debug, quota report | — |

### Do NOT use

| Tool | Why | Reroute to |
|---|---|---|
| `get_funding_rates` | Hits live exchange APIs — slow, unaligned, not the supported path | `get_aggregated_markets` with `exchanges: [key]`, or `get_historical_funding` (latest point) |

`compare_exchanges_for_ticker` is now backed by the DB-aggregated `/tickers/:ticker/markets` endpoint (1 quota point). Prefer `get_ticker_markets` for richer output (includes `suggestedArb`), but either is safe.

The DB stores periodically-collected, time-aligned, deduped snapshots. Live-exchange queries are for ingestion, not analysis.

### Hard argument constraints

- `tickers` must be **UPPERCASE strings**, **1–20 per call** (e.g. `["BTC", "ETH"]`, never `["btc"]`).
- `count` ≤ **50**, `periodDays` ≤ **30** (execution-cost tools allow `periodDays` ≤ **60**). Anything larger is rejected.
- Execution-cost `size` is a bucket: one of `"1k" | "5k" | "10k" | "50k" | "100k"` (defaults to `"10k"`).
- Exchange keys are lowercase (e.g. `"hyperliquid"`, `"edgex"`). Get them from `list_exchanges` if unsure — never invent.
- `list_exchanges` returns a `supportsRWA` flag — filter on it when the user asks about stocks, forex, or commodities perps.
