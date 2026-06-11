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
