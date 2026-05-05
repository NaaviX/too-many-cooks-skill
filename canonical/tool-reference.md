## Tool reference

### Discovery & overview (good entry points)

| Tool | When | Useful args |
|---|---|---|
| `list_exchanges` | Need a valid exchange key, or user asks what's supported | — |
| `list_tickers` | "Which exchanges list HYPE?" / autocomplete / filter by market type | `search`, `marketTypes` |
| `get_platform_stats` | One-shot platform overview (totals, average APR, market-type breakdown) | — |
| `get_funding_spikes` | "What's interesting right now?" / cross-exchange z-score outliers | `threshold`, `count`, `minVolume24h` |
| `get_market_extremes` | Top-N highest/lowest funding rates | `direction`, `count`, `minVolume24h` |
| `whoami` | Auth debug, quota report | — |

### Live-data pulls (DB-backed, time-aligned)

| Tool | When | Useful args |
|---|---|---|
| `get_aggregated_markets` | "Show me X" — filtered snapshot across all exchanges in **one** call | `exchanges`, `tickers`, `marketTypes`, `minVolume24h` |
| `get_ticker_markets` | Cross-exchange snapshot for one symbol + auto-suggested arb | `ticker`, `sort`, `minVolume24h` |
| `get_market_for_ticker_on_exchange` | Single ticker on a single named exchange | `exchange`, `ticker` |
| `get_historical_funding` | Rate evolution over time (1–30 days) | `exchange`, `tickers: []`, `periodDays` |
| `get_exchange_status` | "Is this exchange's data fresh?" — last-write timestamp + healthy flag | `exchange` |

### Strategy discovery & simulation

| Tool | When | Useful args |
|---|---|---|
| `find_arbitrage_strategies` | **Default for arbitrage questions.** Top-N delta-neutral pairs | `count`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays` |
| `find_strategy_for_ticker` | Best long/short pair for one specific ticker | `ticker`, `periodDays`, `minVolume24h` |
| `simulate_strategy` | Project funding PnL (and net of execution cost) for a chosen pair | `ticker`, `longExchange`, `shortExchange`, `notional`, `days` |
| `find_spot_strategies` | Spot-arb (perp/spot pair) — same shape as delta-neutral | `count`, `periodDays`, `minVolume24h` |

### Avoid

| Tool | Why | Use instead |
|---|---|---|
| `get_funding_rates` | Hits live exchange APIs — slow, unaligned, not the supported analysis path | `get_aggregated_markets` (filtered) or `get_historical_funding` (latest point) |
| `compare_exchanges_for_ticker` | Legacy alias kept for back-compat; now delegates to `get_ticker_markets` internally | `get_ticker_markets` directly — same data, cleaner shape (includes `suggestedArb`) |

The DB stores periodically-collected, time-aligned, deduped snapshots refreshed every 10 min. Live-exchange queries are for ingestion, not analysis.

### Hard argument constraints

- `tickers` must be **UPPERCASE strings**. For `get_historical_funding`: 1–20 per call (e.g. `["BTC", "ETH"]`, never `["btc"]`).
- `count` ≤ **50** for strategy tools, ≤ **100** for `get_market_extremes` and `get_funding_spikes`.
- `periodDays` ≤ **30**.
- `limit` on `get_aggregated_markets` ≤ **2000**.
- `minExchanges` on `get_funding_spikes` ≥ **3** (z-score requires peers).
- Exchange keys are lowercase (e.g. `"hyperliquid"`, `"edgex"`). Get them from `list_exchanges` if unsure — never invent.
- `list_exchanges` returns a `hasRwaAssets` flag — filter on it when the user asks about stocks, forex, or commodities perps.
- `marketTypes` (where accepted) must be one of: `crypto`, `stock`, `forex`, `commodity`, `index`, `etf`.
