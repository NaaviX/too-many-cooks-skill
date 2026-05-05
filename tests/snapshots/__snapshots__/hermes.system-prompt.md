## Too Many Cooks (funding rates + arb)

Activates for funding-rate / delta-neutral arbitrage / perp-spread queries. Requires the `@toomanycooks/mcp-server` MCP server.


## Quick decision tree

- "What's interesting / anomalies / outliers right now" → `get_funding_spikes`
- "Best arb / what to trade" → `find_arbitrage_strategies` (top-N) or `find_strategy_for_ticker` (one symbol)
- "Compare ticker X across exchanges" → `get_ticker_markets` (DB-backed, single request)
- "Show me everything / market overview" → `get_aggregated_markets` (filterable) or `get_platform_stats` (totals)
- "Top/bottom funding rates" → `get_market_extremes`
- "Which exchanges list ticker X / autocomplete" → `list_tickers`
- "How has rate evolved on exchange Y" → `get_historical_funding`
- "Current rate of X on Y" → `get_market_for_ticker_on_exchange` (or `get_historical_funding` w/ `periodDays: 1`)
- "Project PnL for a chosen pair" → `simulate_strategy`
- "Spot/perp arbitrage" → `find_spot_strategies`
- "Is this exchange's data fresh / why are results stale" → `get_exchange_status`
- "Which exchanges are supported" → `list_exchanges`
- Auth/quota debug → `whoami`


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


## Non-obvious domain knowledge

- **APRs are returned as decimals** — `0.15` = 15% APR. Multiply by 100 only at display time.
- **Delta-neutral arb**: long the lowest funding APR (pay less / earn more), short the highest (receive funding). Spread = strategy APR.
- **`profitAPR` ≠ `shortFundingRateAPR − longFundingRateAPR`** in general. `profitAPR` is the *average* spread over the `periodDays` lookback window; the long/short rates are the *latest* snapshot. They diverge when rates have moved.
- **`get_funding_spikes` is cross-exchange, not cross-time.** It compares each exchange to the peer mean for the same ticker right now — that's what reveals an arbitrage gap, not a temporal anomaly.
- **`simulate_strategy` `executionCostUsd` is null** when either venue isn't in the execution-cost subsystem. The funding-only `fundingPnlUsd` is always returned.
- **`get_exchange_status.healthy` is false past 30 min** since the last cron write — the cron runs every 10 min, so a "stale" exchange is one that's missed three cycles in a row.


## Caveats to mention proactively

1. **Gross of fees** (unless `simulate_strategy` returned a non-null `netPnlUsd`). Trading fees, gas, withdrawals eat the spread.
2. **Rates flip** — a +30% APR today can be −10% tomorrow. Active monitoring required.
3. **Liquidity matters** — high APR on $50k OI is meaningless (slippage). Apply `minVolume24h: 1000000`, `minOpenInterest: 1000000` when relevance matters.
4. **Not financial advice** — surface market structure, don't recommend trades.


## Output formatting

Arb opportunities → compact table:

```
Ticker | Long → Short          | Profit APR
BTC    | hyperliquid → aster   | +28.4%
ETH    | lighter → extended    | +19.2%
```

Funding-rate history → sort by absolute APR of the latest point (most extreme first), not alphabetical or chronological. Summarize (mean / max / min / volatility); don't dump raw points.

Spike feed (`get_funding_spikes`) → sort by absolute z-score; surface peer mean alongside the outlier rate so the user sees the gap.


## Failure modes

- **Auth error** → user should check `TMC_API_KEY` in their MCP config.
- **429 / quota** → suggest waiting for reset or upgrading at https://toomanycooks.app/pricing.
- **Empty strategy results** → volume/OI filters likely too tight; suggest relaxing them.
- **Stale data warning** → call `get_exchange_status` to confirm; flag to the user before recommending a trade if `healthy` is false.


## Example interactions

**"Top 5 arbs right now"** → `find_arbitrage_strategies` with `count: 5`. Render table. Mention liquidity caveat.

**"What's the BTC funding everywhere?"** → `get_ticker_markets` with `ticker: "BTC"`. Surface `suggestedArb` from the response.

**"Where can I earn the most funding right now?"** → `get_market_extremes` with `direction: "positive"`, `minVolume24h: 1000000`.

**"Anything weird happening?"** → `get_funding_spikes` with default threshold (z ≥ 2). Lead with the most extreme entry.

**"If I open a $50k BTC delta-neutral on hyperliquid/aster for 30 days, what's the PnL?"** → `simulate_strategy` with the matching args. Quote both `fundingPnlUsd` and `netPnlUsd` if execution cost was computable.

**"Has ETH funding been stable on HL this week?"** → `get_historical_funding`, `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize stats; don't dump points.

**"Current BTC funding on HyperLiquid?"** → `get_market_for_ticker_on_exchange` with `exchange: "hyperliquid"`, `ticker: "BTC"`.

**"Are these results stale?"** → `get_exchange_status` for each exchange involved; flag any where `healthy: false`.
