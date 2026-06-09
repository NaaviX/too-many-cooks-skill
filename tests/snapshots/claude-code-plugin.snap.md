---
name: toomanycooks
description: Query crypto perpetuals funding rates and find delta-neutral arbitrage across 25 DEX exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …) via the Too Many Cooks API. Triggers on funding-rate, delta-neutral, perp/perp spread, or "best arb right now"-type questions.
---

# Too Many Cooks — Crypto Funding Rates Skill

Bundled with the `@toomanycooks/mcp-server` MCP server. Configure your `TMC_API_KEY` (free tier at https://toomanycooks.app/dashboard/api-keys).

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

## Personalization

These are the user-tunable defaults (the "dials"): `exchanges`, `minVolume24h`, `minOpenInterest`, `count`, `periodDays`, `riskTolerance`, `quote`. They live in one file and override nothing the user types inline.

Before answering a funding-rate or arbitrage question, check for a user preferences file at `~/.toomanycooks/preferences.md`. If it exists, parse its `key: value` lines and treat them as **defaults** for every tool call. Never block on a missing file — if it isn't there, behave normally (and, in Claude Code, you may suggest running `/toomanycooks-setup` once to capture defaults). Inline instructions in the user's message always override the file.

The file uses simple `key: value` lines (lines starting with `#` are comments):

```
exchanges: hyperliquid, lighter, extended
minVolume24h: 1000000
minOpenInterest: 1000000
count: 5
periodDays: 7
riskTolerance: balanced
quote: USDC
```

Map each key to the matching tool parameter:

| Key | Applies to | Effect |
|---|---|---|
| `exchanges` | any tool with an `exchanges: []` arg (`find_arbitrage_strategies`, `get_aggregated_markets`, `get_market_extremes`, …) | Pass these lowercase keys as the `exchanges` filter. `exchanges: all` (or empty) means no filter. If a tool lacks the arg, post-filter results to these venues. |
| `minVolume24h` | strategy / market scans | Default `minVolume24h`. |
| `minOpenInterest` | `find_arbitrage_strategies` and pair scans | Default `minOpenInterest`. |
| `count` | `find_arbitrage_strategies`, `get_market_extremes`, list-style tools | Default result `count`. |
| `periodDays` | `find_arbitrage_strategies`, `get_historical_funding`, … | Default lookback / funding window. |
| `riskTolerance` | ranking & filtering | `conservative` → raise the liquidity floors and prefer stable, persistent spreads; `aggressive` → loosen floors and surface higher-APR / higher-variance pairs; `balanced` → use defaults. |
| `quote` | strategy selection | When ranking is otherwise close, prefer pairs settled in this quote/collateral asset. |

When you apply preferences, say so briefly (e.g. "using your saved defaults: HyperLiquid/Lighter, $1M liquidity floor") so the user knows personalization is active.

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

### No Too Many Cooks tools available (MCP not registered)

If none of the `toomanycooks` tools (`list_exchanges`, `find_arbitrage_strategies`, …) are
callable, the MCP server isn't connected for this session. **Don't keep retrying** — walk the
user through this checklist, in order. The cause is almost always a missing `TMC_API_KEY`.

1. **Confirm the server is configured.** It must be registered for the platform — a Claude Code /
   Codex **plugin** that's *enabled*, or an `mcpServers.toomanycooks` entry in the platform's MCP
   config file (`.mcp.json`, `~/.cursor/mcp.json`, `.vscode/mcp.json`, …).
2. **Check the API key (the usual culprit).** The config needs `TMC_API_KEY=tmc_live_…`. A free key
   is at https://toomanycooks.app/dashboard/api-keys. **Plugin users:** the key is a *required*
   `userConfig` value — open `/plugin`, select **Too Many Cooks → Configure options**, and paste it
   there (it's stored in the OS keychain, not a plain file). The plugin shows
   *"Plugin option api_key isn't set"* until you do.
3. **Reload.** After setting the key, run `/reload-plugins` (or restart the agent) and re-check
   `/mcp` — the server may need a one-time per-server approval the first time.
4. **Prove the server boots, in isolation.** If it still won't connect, the user can run, in a
   terminal: `TMC_API_KEY=tmc_live_… npx -y @toomanycooks/mcp-server`. A healthy server prints
   `[toomanycooks] MCP server vX.Y.Z listening on stdio`. If that line appears, the package is fine
   and the problem is the agent's config/reload; if it errors, surface that error.

## Example interactions

**"Top 5 arbs right now"** → `find_arbitrage_strategies` with `count: 5`. Render table. Mention liquidity caveat.

**"Compare BTC across HL, Lighter, Extended"** → `get_historical_funding` per exchange in parallel (latest point each), or `find_arbitrage_strategies` with `exchanges: ["hyperliquid", "lighter", "extended"]` if they want the long/short pair. **Do not** use `compare_exchanges_for_ticker`.

**"Has ETH funding been stable on HL this week?"** → `get_historical_funding`, `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize stats; don't dump points.

**"Current BTC funding on HyperLiquid?"** → `get_historical_funding`, `tickers: ["BTC"]`, `periodDays: 1`. Take latest point. **Do not** use `get_funding_rates`.

**"What's an arbitrage strategy?"** → Explain the long-low/short-high mechanic. Optionally call `find_arbitrage_strategies` with `count: 3` to ground the explanation.

## Advanced workflows

For multi-step analysis (multi-ticker screens, funding-flip detection, backtesting a delta-neutral pair, realized-PnL reconstruction), see the bundled recipes reference. Load it on demand — not for one-off lookups.
