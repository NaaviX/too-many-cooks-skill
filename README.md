# Too Many Cooks — agent skills, for every platform

> Crypto perpetuals **funding rates** and **delta-neutral arbitrage** across 25 DEX
> exchanges, available as a one-install plugin/skill/rule for the major AI agents.

Every integration is the same two pieces:

1. **The MCP server** (`@toomanycooks/mcp-server`) — gives the agent the *tools*
   (`find_arbitrage_strategies`, `get_historical_funding`, `list_exchanges`, …).
2. **The skill/rule** (this repo) — gives the agent the *know-how*: which tool to
   reach for, how to read APRs, what caveats to surface. Without it the agent has
   the tools but calls them naively; with it, it behaves like a quant analyst.

## 0. Get an API key (once, for all platforms)

Free tier (100 req/day) at <https://toomanycooks.app/dashboard/api-keys>. The key
looks like `tmc_live_…`. Every config below references it as `TMC_API_KEY`.

## 1. Pick your platform

> **Full step‑by‑step install for every platform: [INSTALL.md](./INSTALL.md).**
> The table below is the quick map.

All generated artifacts live under `dist/` (run `npm run build`). Each platform's
config uses the **same** MCP server launched via `npx`, so nothing to install
globally.

| Platform | Skill/rule file | MCP config |
|---|---|---|
| **Claude Code / Claude Desktop** (skill) | `dist/claude-code-skill/SKILL.md` → `~/.claude/skills/toomanycooks/` | `mcpServers` block (below) |
| **Claude Code** (plugin) | `dist/claude-code-plugin/` (bundles skill + `/tmc-arb`, `/tmc-rates`, `/tmc-setup` + MCP) — install via marketplace (below) | prompts for the key at enable time (`userConfig`) |
| **Cursor** | `dist/cursor/.cursor/rules/toomanycooks.mdc` → project `.cursor/rules/` | `dist/cursor/mcp-snippet.json` → `~/.cursor/mcp.json` |
| **Cline** | `dist/cline/.clinerules/toomanycooks.md` → project `.clinerules/` | `dist/cline/mcp-snippet.json` → Cline MCP settings |
| **Continue.dev** | `dist/continue/.continue/rules/toomanycooks.md` → project `.continue/rules/` | `dist/continue/mcp-snippet.json` → Continue MCP config |
| **Codex CLI** | paste `dist/codex/AGENTS.snippet.md` into your `AGENTS.md` | `dist/codex/mcp-snippet.json` → `~/.codex/config.toml` |
| **Codex** (plugin) | `dist/codex-plugin/` (bundles skill + MCP config) | `dist/codex-plugin/.mcp.json` reads `TMC_API_KEY` from the Codex environment |
| **Hermes** | `dist/hermes/skills/toomanycooks/SKILL.md` or `dist/hermes/system-prompt.md` fallback | `dist/hermes/mcp-snippet.json` |
| **OpenClaw** | `dist/openclaw/skills/toomanycooks/SKILL.md` | `dist/openclaw/skills/toomanycooks/mcp-snippet.json` |

### The MCP server config (Claude Desktop / Claude Code shape)

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

Codex stores MCP servers in `~/.codex/config.toml`; the exact command/args/env
object still ships next to each platform's output as `mcp-snippet.json`.

### Codex plugin

The plugin output (`dist/codex-plugin/`) is a Codex plugin tree with
`.codex-plugin/plugin.json`, `.mcp.json`, and `skills/toomanycooks/SKILL.md`.
Install it through a local/personal Codex marketplace, with `TMC_API_KEY`
available in the environment that launches Codex.

### Claude Code plugin (one-line install)

The plugin output (`dist/claude-code-plugin/`) is also a self-contained plugin
**marketplace** — it carries `.claude-plugin/marketplace.json` alongside
`.claude-plugin/plugin.json`. Once that tree is pushed to a git host (CI mirrors
it to `naavix/toomanycooks-plugin` — see [MARKETPLACES.md](./MARKETPLACES.md)):

```text
/plugin marketplace add naavix/toomanycooks-plugin
/plugin install toomanycooks@toomanycooks
```

On enable, Claude Code prompts for your `TMC_API_KEY` (declared as a `sensitive`
`userConfig` value, stored in the OS keychain) — no hand-editing of the MCP
config. To test the local build before publishing:

```bash
claude --plugin-dir ./dist/claude-code-plugin
```

### Hermes skill and discovery

Hermes gets both install styles:

- Local/tap install artifact: `dist/hermes/skills/toomanycooks/SKILL.md`
- Paste fallback: `dist/hermes/system-prompt.md`
- Well-known hosting tree: `dist/hermes/.well-known/agent-skills/` plus legacy
  `dist/hermes/.well-known/skills/index.json`

To publish for Hermes users, run:

```bash
hermes skills publish dist/hermes/skills/toomanycooks --to github --repo naavix/toomanycooks-hermes-skills
```

To self-host discovery, serve `dist/hermes/.well-known/` from
`https://toomanycooks.app/.well-known/`. The generated Agent Skills index
includes a SHA-256 digest of the generated `SKILL.md`.

## 2. What you can now ask

- *"Show me the top 5 delta-neutral arbitrage opportunities right now."*
- *"Compare BTC funding rates across HyperLiquid, Lighter, and Extended."*
- *"How has ETH funding evolved on HyperLiquid this past week?"*
- *"Which exchanges support stocks and forex perps?"*

### Personalize the answers (optional)

Run **`/tmc-setup`** (Claude Code plugin) once to pick your default exchanges,
liquidity floors, risk tolerance, result count, and funding window. It writes
`~/.toomanycooks/preferences.md`; the skill reads that file on every query and
applies the values as defaults (inline instructions always override them). On
other platforms, create the same `key: value` file by hand — the skill picks it
up automatically.

---

## Also available: CLI and SDK (for humans & scripts)

These are **developer tools**, not agent plugins — published straight to npm.

**CLI** (`tmc`):

```bash
npm i -g @toomanycooks/cli   # then: tmc --help
# or one-shot, no install:
npx -y @toomanycooks/cli strategies -c 5 --json
```

Set `TMC_API_KEY` in your env (or `tmc auth set`). Every command takes `--json`
for shell pipelines.

**SDK** (`@toomanycooks/sdk`) — zero-dependency TypeScript client:

```bash
npm i @toomanycooks/sdk
```

```ts
import { TmcApiClient } from "@toomanycooks/sdk";

const client = new TmcApiClient(); // reads TMC_API_KEY from env
const strategies = await client.findStrategies({ count: 5 });
console.log(strategies);
```

---

## Maintaining this repo

Single source of truth is `canonical/*.md` (shared markdown blocks) +
`platforms/<name>/recipe.json` (which blocks, what frontmatter, what extras).
A ~150-line build assembles every platform output.

```bash
npm install
npm run build     # regenerate dist/ for all 9 platforms
npm test          # vitest — snapshot per platform + unit tests
npm run check     # Biome lint + format
```

To change the knowledge (new tool, pricing, caveat): edit the relevant
`canonical/*.md` block once, bump `version` in `canonical/_frontmatter.yml`,
`npm run build`, re-bless snapshots (`npm test -- -u`), commit. CI mirrors the
marketplace-bound outputs to their standalone repos — see
[MARKETPLACES.md](./MARKETPLACES.md).

## License

MIT.
