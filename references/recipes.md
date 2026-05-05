# Recipes — Multi-step analysis patterns

Load this file when a single tool call won't answer the question. For one-off lookups, stick with the [SKILL.md](../SKILL.md) decision tree.

All APRs below are **decimals** (`0.15` = 15% APR) — same convention as the API.

## Recipe 1 — Multi-ticker screen on one exchange

**Question shape:** "Which of {BTC, ETH, SOL, ARB, OP} has the most extreme funding on HyperLiquid right now?"

Use the fact that `get_historical_funding` accepts up to 20 tickers in a single call.

```
get_historical_funding(
  exchange: "hyperliquid",
  tickers: ["BTC", "ETH", "SOL", "ARB", "OP"],
  periodDays: 1
)
```

For each ticker, take the most recent point. Sort by `|APR|` descending. Render as a compact table; do not dump intermediate snapshots.

## Recipe 2 — Funding flip detection

**Question shape:** "Has BTC funding flipped sign on Lighter recently?" / "Show me tickers whose funding flipped this week."

```
get_historical_funding(exchange, tickers, periodDays: 7)
```

Iterate the time-series for each ticker. A flip is `sign(rate[i]) != sign(rate[i-1])` with both magnitudes above a noise threshold (suggest `|rate| > 0.01` ≈ 1% APR — tighter and you'll see noise flips).

Report: ticker, flip timestamp, before/after APR, current sign. Skip tickers with no flips.

## Recipe 3 — Backtest a delta-neutral pair

**Question shape:** "What would the realized PnL of long BTC on HyperLiquid / short BTC on Aster have been over the past 14 days?"

Two parallel calls:

```
get_historical_funding(exchange: "hyperliquid", tickers: ["BTC"], periodDays: 14)
get_historical_funding(exchange: "aster",       tickers: ["BTC"], periodDays: 14)
```

Align the time-series by timestamp (drop unaligned points; the DB usually emits at the same cadence but exchanges differ in funding interval). Per aligned snapshot:

- `spread_apr[t] = short_apr[t] - long_apr[t]` (here: `aster - hyperliquid`)
- `realized_funding[t] = spread_apr[t] * dt_hours / (24 * 365)` (per dollar of notional, per leg)

Sum across `t`. Report: total realized funding APR, mean, max single-period spread, fraction of periods with negative spread (drag).

**Caveat to mention:** this ignores fees, gas, withdrawal cost, and any liquidation events. It's the *funding-only* backtest, not real PnL.

## Recipe 4 — Strategy stability check before recommending

**Question shape:** Before answering "best arb right now", de-risk the answer by checking the spread is sticky.

1. `find_arbitrage_strategies(count: 10, periodDays: 7)` — get current rankings.
2. For the top 1–3 strategies, do `get_historical_funding` on both legs over `periodDays: 14`.
3. Compute the daily spread series. Flag any strategy where:
   - The spread spent >30% of the window negative, OR
   - The spread's std-dev exceeds its mean (high-volatility, unstable edge).

Demote unstable strategies; promote ones with low-variance positive spread. Report which ones survived this filter.

## Recipe 5 — RWA-only screen (stocks / forex / commodities)

**Question shape:** "Which exchanges let me trade Tesla perps?" / "Where can I get forex perps?"

```
list_exchanges()  // returns name, key, supportsRWA
```

Filter on `supportsRWA === true`. Then per RWA-capable exchange, the user can poke specific tickers (e.g. `TSLA`, `EURUSD`) via `get_historical_funding` to see if that asset is actually listed there — empty results = not listed.

## Output discipline for advanced workflows

- Always state the inputs you used (`exchange`, `tickers`, `periodDays`) before the result.
- For backtests, report the date range covered, not just the duration.
- Multi-leg analysis: name which exchange is the long leg and which is the short leg explicitly. Do not let the user infer it from row order.
