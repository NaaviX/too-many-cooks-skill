# Too Many Cooks — agent skill, for every platform

> Crypto perpetuals **funding rates** and **delta-neutral arbitrage** across 25 DEX
> exchanges — packaged as a one-install skill/rule/plugin for every major AI agent.

Each integration is two pieces:

1. **The MCP server** (`@toomanycooks/mcp-server`) — gives the agent the *tools*
   (`find_arbitrage_strategies`, `get_historical_funding`, `list_exchanges`, …).
2. **The skill** (this repo) — gives the agent the *know-how*: which tool to reach
   for, how to read APRs, what caveats to surface. With it, the agent behaves like
   a quant analyst instead of calling tools blindly.

## Quick start

**1. Get an API key** (once, all platforms). Free tier = 100 req/day at
<https://toomanycooks.app/dashboard/api-keys>. Looks like `tmc_live_…`.

**2. Install the skill for your platform.** Easiest is the one-liner — any
[Agent-Skills](https://github.com/vercel-labs/agent-skills) host (Cursor, Codex,
Claude, ChatGPT) pulls it straight from this repo, no clone:

```bash
npx skills add github.com/naavix/too-many-cooks-skill
```

Or build from source and let the helper drop the file in place:

```bash
npm install && npm run build
./install.sh <platform>        # ./install.sh --list  to see options
```

**3. Add the MCP server** (Claude Desktop / Claude Code shape — every platform
ships its own `mcp-snippet.json` next to its output):

```json
{
  "mcpServers": {
    "toomanycooks": {
      "command": "npx",
      "args": ["-y", "@toomanycooks/mcp-server"],
      "env": { "TMC_API_KEY": "tmc_live_..." }
    }
  }
}
```

The Claude Code and Codex **plugins** bundle the skill *and* MCP config together
and prompt for the key on enable — no hand-editing.

> **Full per-platform paths and step-by-step setup: [INSTALL.md](./INSTALL.md).**

## Supported platforms

`npm run build` generates every artifact under `dist/`. All configs launch the
same MCP server via `npx`, so there's nothing to install globally.

| Platform | Skill/rule artifact |
|---|---|
| **Claude Code / Desktop** (skill) | `dist/claude-code-skill/SKILL.md` |
| **Claude Code** (plugin) | `dist/claude-code-plugin/` — skill + slash commands + MCP, marketplace install |
| **Codex CLI** | `dist/codex/AGENTS.snippet.md` |
| **Codex** (plugin) | `dist/codex-plugin/` — skill + MCP |
| **Cursor** | `dist/cursor/.cursor/rules/toomanycooks.mdc` |
| **Cline** | `dist/cline/.clinerules/toomanycooks.md` |
| **Continue.dev** | `dist/continue/.continue/rules/toomanycooks.md` |
| **GitHub Copilot** | `dist/copilot/.github/copilot-instructions.md` |
| **Gemini** | `dist/gemini/GEMINI.md` |
| **JetBrains Junie** | `dist/junie/.junie/guidelines.md` |
| **Roo Code** | `dist/roo/.roo/rules/toomanycooks.md` |
| **Windsurf** | `dist/windsurf/.windsurf/rules/toomanycooks.md` |
| **Zed** | `dist/zed/.rules` |
| **Hermes** | `dist/hermes/system-prompt.md` (+ `.well-known/` discovery tree) |
| **OpenClaw** | `dist/openclaw/skills/toomanycooks/SKILL.md` |
| **Agent Skills** (`npx skills add`) | repo-root `skills/toomanycooks/SKILL.md` |

Plugin / marketplace publishing details: **[MARKETPLACES.md](./MARKETPLACES.md)**.

## What you can ask

- *"Show me the top 5 delta-neutral arbitrage opportunities right now."*
- *"Compare BTC funding rates across HyperLiquid, Lighter, and Extended."*
- *"How has ETH funding evolved on HyperLiquid this past week?"*
- *"Which exchanges support stocks and forex perps?"*

**Personalize (optional):** run `/toomanycooks-setup` (Claude Code plugin) once to
set default exchanges, liquidity floors, risk tolerance, and funding window. It
writes `~/.toomanycooks/preferences.md`, which the skill reads on every query
(inline instructions always override). On other platforms, write that same
`key: value` file by hand — the skill picks it up automatically.

## Also available: CLI & SDK

Developer tools (not agent plugins), published to npm.

```bash
# CLI — tmc
npx -y @toomanycooks/cli strategies -c 5 --json   # one-shot, no install
npm i -g @toomanycooks/cli && tmc --help          # global install

# SDK — zero-dependency TypeScript client
npm i @toomanycooks/sdk
```

```ts
import { TmcApiClient } from "@toomanycooks/sdk";

const client = new TmcApiClient();             // reads TMC_API_KEY from env
console.log(await client.findStrategies({ count: 5 }));
```

## Maintaining this repo

Single source of truth: `canonical/*.md` (shared markdown blocks) +
`platforms/<name>/recipe.json` (which blocks, what frontmatter, what extras). A
~150-line build assembles every platform output.

```bash
npm install
npm run build       # regenerate dist/ for every platform
npm test            # vitest — snapshot per platform + unit tests
npm test -- -u      # re-bless snapshots after an intentional content change
npm run check       # Biome lint + format
```

To change the knowledge (new tool, pricing, caveat): edit the relevant
`canonical/*.md` block **once**, bump `version` in `canonical/_frontmatter.yml`,
`npm run build`, re-bless snapshots, commit. Never hand-edit `dist/` (gitignored)
or `skills/toomanycooks/SKILL.md` (generated) — fix the canonical source instead.
CI mirrors the marketplace-bound outputs to their standalone repos.

## License

MIT.
