---
name: toomanycooks
description: Query crypto perpetuals funding rates and find delta-neutral arbitrage across 25 DEX exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …) via the Too Many Cooks API. Triggers on funding-rate, delta-neutral, perp/perp spread, or "best arb right now"-type questions.
---

# Too Many Cooks — Crypto Funding Rates Skill

Bundled with the `@toomanycooks/mcp-server` MCP server. Configure your `TMC_API_KEY` (free tier at https://toomanycooks.app/dashboard/api-keys).

## Quick decision tree

- "Best arb / what to trade" → `find_arbitrage_strategies`
- "Compare exchanges for ticker X" → `get_ticker_markets` (DB-backed, 1 quota point) or `compare_exchanges_for_ticker`
- "How has rate evolved on exchange Y" → `get_historical_funding`
- "Current rate of X on Y" → `get_historical_funding` with `periodDays: 1`, take the most recent point
- "Which exchanges are supported" → `list_exchanges`
- Auth/quota debug → `whoami`

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
| `get_funding_rates` | Hits live exchange APIs — slow, unaligned, not the supported path | `get_aggregated_markets` with `exchanges: [key]`, or `get_historical_funding` (latest point) |

`compare_exchanges_for_ticker` is now backed by the DB-aggregated `/tickers/:ticker/markets` endpoint (1 quota point). Prefer `get_ticker_markets` for richer output (includes `suggestedArb`), but either is safe.

The DB stores periodically-collected, time-aligned, deduped snapshots. Live-exchange queries are for ingestion, not analysis.

### Hard argument constraints

- `tickers` must be **UPPERCASE strings**, **1–20 per call** (e.g. `["BTC", "ETH"]`, never `["btc"]`).
- `count` ≤ **50**, `periodDays` ≤ **30**. Anything larger is rejected.
- Exchange keys are lowercase (e.g. `"hyperliquid"`, `"edgex"`). Get them from `list_exchanges` if unsure — never invent.
- `list_exchanges` returns a `supportsRWA` flag — filter on it when the user asks about stocks, forex, or commodities perps.

## Non-obvious domain knowledge

- **APRs are returned as decimals** — `0.15` = 15% APR. Multiply by 100 only at display time.
- **Delta-neutral arb**: long the lowest funding APR (pay less / earn more), short the highest (receive funding). Spread = strategy APR.
- **`profitAPR` ≠ `shortFundingRateAPR − longFundingRateAPR`** in general. `profitAPR` is the *average* spread over the `periodDays` lookback window; the long/short rates are the *latest* snapshot. They diverge when rates have moved.

## Caveats to mention proactively

1. **Gross of fees** — trading fees, gas, withdrawals eat the spread.
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

Funding rate history → sort by absolute APR of the latest point (most extreme first), not alphabetical or chronological. Summarize (mean / max / min / volatility); don't dump raw points.

## Failure modes

- **Auth error** → user should check `TMC_API_KEY` in their MCP config.
- **429 / quota** → suggest waiting for reset or upgrading at https://toomanycooks.app/pricing.
- **Empty strategy results** → volume/OI filters likely too tight; suggest relaxing them.

## Example interactions

**"Top 5 arbs right now"** → `find_arbitrage_strategies` with `count: 5`. Render table. Mention liquidity caveat.

**"Compare BTC across HL, Lighter, Extended"** → `get_historical_funding` per exchange in parallel (latest point each), or `find_arbitrage_strategies` with `exchanges: ["hyperliquid", "lighter", "extended"]` if they want the long/short pair. **Do not** use `compare_exchanges_for_ticker`.

**"Has ETH funding been stable on HL this week?"** → `get_historical_funding`, `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize stats; don't dump points.

**"Current BTC funding on HyperLiquid?"** → `get_historical_funding`, `tickers: ["BTC"]`, `periodDays: 1`. Take latest point. **Do not** use `get_funding_rates`.

**"What's an arbitrage strategy?"** → Explain the long-low/short-high mechanic. Optionally call `find_arbitrage_strategies` with `count: 3` to ground the explanation.

## Advanced workflows

For multi-step analysis (multi-ticker screens, funding-flip detection, backtesting a delta-neutral pair, realized-PnL reconstruction), see the bundled recipes reference. Load it on demand — not for one-off lookups.
