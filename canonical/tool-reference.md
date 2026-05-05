## Tool reference

### Discovery & overview (good entry points)

| Tool | When | Useful args |
|---|---|---|
| `list_exchanges` | Discover valid exchange keys | — |
| `list_tickers` | "Which exchanges list HYPE?", autocomplete | `search`, `marketTypes` |
| `get_platform_stats` | One-shot platform overview | — |
| `get_funding_spikes` | "What's interesting right now?" — cross-exchange z-score outliers | `threshold`, `count`, `minVolume24h` |
| `get_market_extremes` | Top-N highest/lowest rates | `direction`, `count`, `minVolume24h` |
| `whoami` | Auth debug, quota report | — |

### Live-data pulls (DB-backed, time-aligned)

| Tool | When | Useful args |
|---|---|---|
| `get_aggregated_markets` | Filtered snapshot across all exchanges in **one** call | `exchanges`, `tickers`, `marketTypes`, `minVolume24h` |
| `get_ticker_markets` | Cross-exchange snapshot for one symbol + auto-suggested arb | `ticker`, `sort`, `minVolume24h` |
| `get_market_for_ticker_on_exchange` | One ticker on one named exchange | `exchange`, `ticker` |
| `get_historical_funding` | Rate evolution over time (1–30 days) | `exchange`, `tickers: []`, `periodDays` |
| `get_exchange_status` | "Is this exchange's data fresh?" | `exchange` |

### Strategy discovery & simulation

| Tool | When | Useful args |
|---|---|---|
| `find_arbitrage_strategies` | **Default for arbitrage questions.** | `count`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays` |
| `find_strategy_for_ticker` | Best long/short pair for one specific ticker | `ticker`, `periodDays` |
| `simulate_strategy` | Project funding PnL (and net of execution cost) for a chosen pair | `ticker`, `longExchange`, `shortExchange`, `notional`, `days` |
| `find_spot_strategies` | Spot-arb (perp/spot pair) | `count`, `periodDays` |

### Avoid

| Tool | Why | Reroute to |
|---|---|---|
| `get_funding_rates` | Hits live exchange APIs — slow, unaligned | `get_aggregated_markets` or `get_historical_funding` |
| `compare_exchanges_for_ticker` | Legacy — kept for back-compat, now delegates to `get_ticker_markets` | `get_ticker_markets` directly |

The DB stores periodically-collected, time-aligned, deduped snapshots refreshed every 10 min. Live-exchange queries are for ingestion, not analysis.

### Hard argument constraints

- `tickers` must be **UPPERCASE strings**, **1–20 per call** for `get_historical_funding` (e.g. `["BTC", "ETH"]`, never `["btc"]`).
- `count` ≤ **50** for strategy tools, ≤ **100** for `get_market_extremes` and `get_funding_spikes`.
- `periodDays` ≤ **30**. `limit` on `get_aggregated_markets` ≤ **2000**. `minExchanges` on `get_funding_spikes` ≥ **3**.
- Exchange keys are lowercase (e.g. `"hyperliquid"`, `"edgex"`). Get them from `list_exchanges` — never invent.
- `list_exchanges` returns a `hasRwaAssets` flag — filter on it for stocks/forex/commodities perps.
- `marketTypes` (where accepted) must be one of: `crypto`, `stock`, `forex`, `commodity`, `index`, `etf`.
