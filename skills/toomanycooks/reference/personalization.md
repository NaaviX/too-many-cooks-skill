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
