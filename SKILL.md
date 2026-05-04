---
name: toomanycooks
description: Query crypto perpetuals funding rates across 26 DEX exchanges and find delta-neutral arbitrage opportunities via the Too Many Cooks API. Use when the user asks about funding rates, delta-neutral arbitrage, perp/perp spreads, or comparing rates between exchanges like HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, etc. Trigger on questions like "what's the best arb right now", "show me funding rates for BTC", "compare ETH on hyperliquid vs lighter".
---

# Too Many Cooks — Crypto Funding Rates Skill

You have access to the Too Many Cooks API for crypto perpetuals funding rates and delta-neutral arbitrage strategy detection across **26 DEX exchanges**: HyperLiquid, Lighter, Extended, Paradex, EdgeX, Aster, Variational, Reya, Pacifica, Backpack, Ethereal, Vest, TradeXYZ, Drift, Evedex, APEX, ARKM, dYdX, Aevo, 01, Nado, GRVT, Astros, StandX, Hibachi, Bullpen.

## How to use this skill

This skill is powered by an MCP server (`@toomanycooks/mcp-server`). When the user asks about funding rates or arbitrage, call the relevant MCP tool:

| Tool | When to use |
|---|---|
| `list_exchanges` | User asks which exchanges are supported, or you need a valid exchange key for another tool |
| `get_funding_rates` | User wants the live funding rate snapshot for one specific exchange |
| `get_historical_funding` | User wants to see how funding rates have evolved over time for a specific ticker on a specific exchange |
| `find_arbitrage_strategies` | **Default tool for arbitrage questions.** User wants to know "where's the best arb right now", "what should I trade", or similar |
| `compare_exchanges_for_ticker` | User wants to compare the funding rate of a single ticker across multiple exchanges |
| `whoami` | Debug auth issues or report quota usage |

## Setup (one-time, by the user)

If the user hasn't installed the MCP server yet, give them this snippet for `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "toomanycooks": {
      "command": "npx",
      "args": ["-y", "@toomanycooks/mcp-server"],
      "env": {
        "TMC_API_KEY": "tmc_live_..."
      }
    }
  }
}
```

They get a free API key (100 req/day) at https://toomanycooks.app/dashboard/api-keys.

## Domain knowledge — funding rate basics

Funding rates are periodic payments between long and short perpetual futures positions, designed to keep the perp price tethered to spot.

- **Positive funding rate** = longs pay shorts (perp > spot, market is bullish)
- **Negative funding rate** = shorts pay longs (perp < spot, market is bearish)
- **APR convention**: the API returns funding rates as **annualized decimals** (e.g. `0.15` = 15% APR, not 15bps). Multiply by 100 only at display time.
- **Delta-neutral arbitrage**: long the exchange with the lowest funding rate, short the exchange with the highest. The spread is the strategy's APR.

## How to interpret arbitrage strategies

When `find_arbitrage_strategies` returns results, each row contains:

- `ticker` — the asset (e.g. "BTC")
- `longExchange` — exchange where you'd open the long leg (lowest funding APR — you pay less or earn more)
- `shortExchange` — exchange where you'd open the short leg (highest funding APR — you receive funding)
- `longFundingRateAPR`, `shortFundingRateAPR` — the underlying rates (decimals)
- `profitAPR` = `shortFundingRateAPR - longFundingRateAPR` — the gross spread

**Important caveats to mention proactively**:
1. **Profit is gross of fees**: trading fees, gas, withdrawal/transfer costs eat into the spread.
2. **Funding rates can flip**: a 30% APR spread today can become a -10% spread tomorrow. Strategies need active monitoring.
3. **Liquidity matters**: a high APR on a market with $50k of OI is meaningless — slippage will dwarf the funding edge. Use the `--min-volume 1000000 --min-oi 1000000` filters when relevance matters.
4. **This is not financial advice**: you're surfacing market structure, not recommending trades.

## Output formatting

When showing arb opportunities, prefer a compact table:

```
Ticker | Long → Short          | Profit APR
BTC    | hyperliquid → aster   | +28.4%
ETH    | lighter → extended    | +19.2%
...
```

When showing funding rates for one exchange, sort by absolute APR (most extreme first) — that's the actionable info, not alphabetical.

## Failure modes

- **Auth error**: tell the user to check `TMC_API_KEY` in their MCP config.
- **Quota error (429)**: suggest upgrading at https://toomanycooks.app/pricing or waiting until the daily/monthly reset.
- **Empty strategy results**: usually means the volume/OI filters are too tight. Suggest relaxing them.

## Example interactions

**User**: "Show me the top 5 arbitrage opportunities right now"

You: Call `find_arbitrage_strategies` with `count: 5`. Render a table. Mention liquidity caveats.

---

**User**: "Compare BTC funding across HL, Lighter, and Extended"

You: Call `compare_exchanges_for_ticker` with `ticker: "BTC"`, `exchanges: ["hyperliquid", "lighter", "extended"]`. Show as a sorted table. Identify which would be the long leg and which the short.

---

**User**: "Has ETH funding been stable on HyperLiquid this week?"

You: Call `get_historical_funding` with `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize: mean, max, min, volatility. Don't dump raw data points.

---

**User**: "What's an arbitrage strategy?"

You: Explain the concept clearly (longs pay shorts, perp tethering, delta-neutral). Optionally call `find_arbitrage_strategies` with `count: 3` to ground the explanation in current data.
