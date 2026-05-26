# Too Many Cooks Skill

> Claude Code skill that gives Claude direct access to crypto perpetuals funding rates and delta-neutral arbitrage opportunities across 25 DEX exchanges.

## What it does

Once installed, Claude can answer questions like:

- *"Show me the top 5 delta-neutral arbitrage opportunities right now."*
- *"Compare BTC funding rates across HyperLiquid, Lighter, and Extended."*
- *"How has ETH funding evolved on HyperLiquid this past week?"*
- *"Which exchanges support stocks and forex perps?"*

…by calling the `@toomanycooks/mcp-server` MCP server under the hood.

## Install

### 1. Get an API key

Free tier (100 req/day) at https://toomanycooks.app/dashboard/api-keys.

### 2. Install the MCP server

Add to `claude_desktop_config.json` (or your Claude Code MCP config):

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

### 3. Install this skill

Copy `SKILL.md` into your Claude Code skills folder:

```bash
# macOS / Linux
mkdir -p ~/.claude/skills/toomanycooks
cp /path/to/toomanycooks/skill/SKILL.md ~/.claude/skills/toomanycooks/SKILL.md
```

Or clone this workspace and symlink:

```bash
mkdir -p ~/.claude/skills
ln -s /path/to/toomanycooks/skill ~/.claude/skills/toomanycooks
```

Restart Claude. You should now see "toomanycooks" in your skill list.

## How it differs from raw MCP usage

The MCP server alone gives Claude the *tools*. This skill adds *domain knowledge* on top: how to interpret funding rates, what caveats to mention (fees, liquidity, rate flips), and which tool to reach for in which situation. Without the skill, Claude has the tools but no context — it would call them naively. With the skill, it behaves like a quant analyst.

## License

MIT.
