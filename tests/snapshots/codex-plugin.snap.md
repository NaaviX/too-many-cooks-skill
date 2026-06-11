---
name: toomanycooks
description: Query crypto perpetuals funding rates and find delta-neutral arbitrage across 25 DEX exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …) via the Too Many Cooks API. Triggers on funding-rate, delta-neutral, perp/perp spread, or "best arb right now"-type questions.
---

# Too Many Cooks - Codex Data Plugin

Bundled with the `@toomanycooks/mcp-server` MCP server. Set `TMC_API_KEY` in the Codex environment before the MCP server starts (free tier at https://toomanycooks.app/dashboard/api-keys).

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
- **No `toomanycooks` tools callable at all** → the MCP server isn't connected; **don't keep
  retrying** — walk the user through `reference/mcp-troubleshooting.md` (usually a missing `TMC_API_KEY`).

## Example interactions

**"Top 5 arbs right now"** → `find_arbitrage_strategies` with `count: 5`. Render table. Mention liquidity caveat.

**"Compare BTC across HL, Lighter, Extended"** → `get_historical_funding` per exchange in parallel (latest point each), or `find_arbitrage_strategies` with `exchanges: ["hyperliquid", "lighter", "extended"]` if they want the long/short pair. **Do not** use `compare_exchanges_for_ticker`.

**"Has ETH funding been stable on HL this week?"** → `get_historical_funding`, `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize stats; don't dump points.

**"Current BTC funding on HyperLiquid?"** → `get_historical_funding`, `tickers: ["BTC"]`, `periodDays: 1`. Take latest point. **Do not** use `get_funding_rates`.

**"What's an arbitrage strategy?"** → Explain the long-low/short-high mechanic. Optionally call `find_arbitrage_strategies` with `count: 3` to ground the explanation.

## Reference files (load on demand)

This skill bundles deeper reference docs in `reference/`. They are **not** needed for routine
lookups — load one only when the situation calls for it, then act on it.

- **`reference/tool-reference.md`** — full per-tool parameter tables, hard argument constraints
  (ticker casing, `count`/`periodDays` caps, execution-cost `size` buckets), and the
  `get_funding_rates` "do NOT use" reroute. Read it when you need a tool's exact arguments.
- **`reference/personalization.md`** — the `~/.toomanycooks/preferences.md` defaults (`exchanges`,
  liquidity floors, `riskTolerance`, `quote`, …) and how each key maps to a tool parameter. Read it
  before applying saved user defaults.
- **`reference/advanced-workflows.md`** — multi-step recipes (multi-ticker screens, funding-flip
  detection, backtesting, realized-PnL reconstruction). Read it for genuinely multi-step analysis.
- **`reference/mcp-troubleshooting.md`** — what to do when **no** `toomanycooks` tool is callable
  (MCP server not registered). Read it only in that failure case.
