---
description: Crypto perpetuals funding rates + delta-neutral arbitrage across 25 DEX exchanges via the Too Many Cooks MCP server.
globs: []
alwaysApply: false
---

# Too Many Cooks — Crypto Funding Rates

Activates when the user asks about funding rates, delta-neutral arbitrage, perp/perp spreads, or "best arb right now". Requires the `@toomanycooks/mcp-server` MCP server (see project README for setup).

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
