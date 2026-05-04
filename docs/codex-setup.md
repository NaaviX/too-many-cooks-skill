# Setup for OpenAI Codex

OpenAI Codex (the agent CLI / desktop runtime) supports MCP servers via stdio.

## 1. Get an API key

Free tier at https://toomanycooks.app/dashboard/api-keys.

## 2. Add the MCP server to Codex config

Edit `~/.codex/mcp.json` (path may vary by Codex install — check your version's docs):

```json
{
  "servers": {
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

## 3. (Optional) Add system prompt context

Codex doesn't have a "skill" mechanism like Claude Code, so to get the same domain-aware behavior, paste this into your Codex system prompt or `.codex/instructions.md`:

```markdown
You have access to the Too Many Cooks MCP server, which exposes 6 tools for querying
crypto perpetuals funding rates and finding delta-neutral arbitrage across 26 DEX
exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …).

When the user asks about funding rates or arbitrage:
- For "best arb / top opportunities" questions, call `find_arbitrage_strategies`.
- For comparing one ticker across exchanges, call `compare_exchanges_for_ticker`.
- For one exchange's full snapshot, call `get_funding_rates`.
- For history/stability analysis, call `get_historical_funding`.

Funding rates are returned as decimal APR (0.15 = 15%). Always mention that
profit estimates are gross of fees, gas, and liquidity-induced slippage. Use
the `--min-volume` and `--min-oi` filters when relevance matters.
```

## 4. Verify

Restart Codex. The 6 tools should appear in the available-tools list. Try:

> "Use Too Many Cooks to find the top 3 delta-neutral arbitrage opportunities"

## Troubleshooting

- **Tools don't appear**: check Codex's MCP debug log (`codex --debug` or equivalent) — usually a JSON syntax error in `mcp.json` (trailing comma, wrong path).
- **`TMC_API_KEY is not set`**: don't pass the key as a CLI flag; set it via the `env` block in `mcp.json`. Codex spawns the MCP server in a sandboxed process and your shell env doesn't propagate.
- **`Authentication failed`**: regenerate a key at https://toomanycooks.app/dashboard/api-keys.
