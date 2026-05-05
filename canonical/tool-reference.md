## Tool reference

### Use these (database-backed)

| Tool | When | Useful args |
|---|---|---|
| `list_exchanges` | Need a valid exchange key, or user asks what's supported | — |
| `get_historical_funding` | Rate evolution over time, or "current rate" via the latest point | `exchange`, `tickers: []`, `periodDays` |
| `find_arbitrage_strategies` | **Default for arbitrage questions.** | `count`, `exchanges: []`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays` |
| `whoami` | Auth debug, quota report | — |

### Do NOT use

| Tool | Why | Reroute to |
|---|---|---|
| `get_funding_rates` | Hits live exchange APIs — slow, unaligned, not the supported path | `get_historical_funding` (latest point) |
| `compare_exchanges_for_ticker` | Same problem (live fan-out) | `get_historical_funding` per exchange in parallel, or `find_arbitrage_strategies` with `exchanges: [...]` |

The DB stores periodically-collected, time-aligned, deduped snapshots. Live-exchange queries are for ingestion, not analysis.

### Hard argument constraints

- `tickers` must be **UPPERCASE strings**, **1–20 per call** (e.g. `["BTC", "ETH"]`, never `["btc"]`).
- `count` ≤ **50**, `periodDays` ≤ **30**. Anything larger is rejected.
- Exchange keys are lowercase (e.g. `"hyperliquid"`, `"edgex"`). Get them from `list_exchanges` if unsure — never invent.
- `list_exchanges` returns a `supportsRWA` flag — filter on it when the user asks about stocks, forex, or commodities perps.
