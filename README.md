<div align="center">

# 🍳 Too Many Cooks — agent skill

**Crypto perpetuals funding rates & delta-neutral arbitrage across 25 DEX exchanges — for every major AI agent.**

[![version](https://img.shields.io/badge/version-1.2.0-2563eb)](./canonical/_frontmatter.yml)
[![npm: mcp-server](https://img.shields.io/npm/v/@toomanycooks/mcp-server?label=mcp-server&color=cb3837)](https://www.npmjs.com/package/@toomanycooks/mcp-server)
[![license](https://img.shields.io/badge/license-MIT-22c55e)](#license)
[![skills add](https://img.shields.io/badge/install-npx%20skills%20add-000000)](#-install)

</div>

---

Every integration is **two pieces**:

| Piece | What it is | What it does |
|---|---|---|
| 🔌 **MCP server** | `@toomanycooks/mcp-server` (npm) | Gives the agent the *tools* — `find_arbitrage_strategies`, `get_historical_funding`, `list_exchanges`, … |
| 🧠 **The skill** | *this repo* | Gives the agent the *know-how* — which tool to reach for, how to read APRs, what caveats to surface. The agent acts like a quant analyst instead of calling tools blindly. |

## 🚀 Install

### 1. Get a free API key

100 req/day at **[toomanycooks.app/dashboard/api-keys](https://toomanycooks.app/dashboard/api-keys)**. It looks like `tmc_live_…` — every config below calls it `TMC_API_KEY`.

### 2. Pick your platform

Find your tool below, then **expand the matching box** for copy-paste commands.
**Not sure?** Use the last one — `npx skills add` covers ~70 agents.

| Your tool | Install route | Bundles MCP? |
|---|---|:---:|
| **Claude Code** | plugin marketplace | ✅ |
| **Codex** | plugin marketplace | ✅ |
| **Cursor** | rule file + MCP | — |
| **GitHub Copilot** | instructions + MCP | — |
| **Hermes** | skill + MCP | — |
| **Anything else** <br><sub>Cline · Continue · Windsurf · Roo · Zed · Gemini · Junie · OpenClaw · …</sub> | `npx skills add` | — |

<details>
<summary><b>Claude Code</b> — plugin (recommended)</summary>

<br>

Bundles the skill, the MCP server, and three slash commands. Prompts for your key on enable — nothing to hand-edit.

```text
/plugin marketplace add naavix/toomanycooks-plugin
/plugin install toomanycooks@toomanycooks
```

</details>

<details>
<summary><b>Codex</b> — plugin</summary>

<br>

Install the plugin tree `dist/codex-plugin/` via a local/personal Codex marketplace. It bundles the skill and `.mcp.json`, which reads `TMC_API_KEY` from the environment that launches Codex.

> Prefer the skill without the plugin? Use `npx skills add` (see the **Any other editor** box below) — Codex is a supported target.

</details>

<details>
<summary><b>Cursor</b></summary>

<br>

```bash
npm install && npm run build
./install.sh cursor          # copies the rule + prints the MCP snippet
```

Then add the printed `toomanycooks` block to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project).

</details>

<details>
<summary><b>GitHub Copilot</b></summary>

<br>

```bash
npm install && npm run build
./install.sh copilot         # copies instructions + prints the MCP snippet
```

Then add the printed block to `.vscode/mcp.json` (or your Copilot MCP settings).

</details>

<details>
<summary><b>Hermes</b></summary>

<br>

```bash
npm install && npm run build
./install.sh hermes
```

Hermes reads the `required_environment_variables` block in `SKILL.md` and prompts for `TMC_API_KEY`. A `.well-known/` discovery tree is also generated — see [INSTALL.md](./INSTALL.md#hermes).

</details>

<details open>
<summary><b>Any other editor</b> — <code>npx skills add</code> (default)</summary>

<br>

Cline, Continue, Windsurf, Roo, Zed, Gemini, Junie, OpenClaw, Claude Code and ~60 more are supported targets of the [`skills`](https://github.com/vercel-labs/skills) CLI. It pulls the skill straight from this repo — no clone, no build:

```bash
npx skills add github.com/naavix/too-many-cooks-skill
# target specific agents:  npx skills add github.com/naavix/too-many-cooks-skill -a cline -a windsurf
```

This installs the **know-how only** — finish with step 3 below.

</details>

### 3. Add the MCP server

The two plugins above do this for you. Everywhere else, register this object once (every built platform also ships it as `mcp-snippet.json`):

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

📖 **Full per-platform paths and step-by-step setup → [INSTALL.md](./INSTALL.md).**

## 💬 What you can ask

> *"Show me the top 5 delta-neutral arbitrage opportunities right now."*
> *"Compare BTC funding rates across HyperLiquid, Lighter, and Extended."*
> *"How has ETH funding evolved on HyperLiquid this past week?"*
> *"Which exchanges support stocks and forex perps?"*

**Personalize (optional):** run `/toomanycooks-setup` (Claude Code plugin) once to set default exchanges, liquidity floors, risk tolerance, and funding window. It writes `~/.toomanycooks/preferences.md`, read on every query (inline instructions always override). On other platforms, create that `key: value` file by hand.

## 🛠️ Also available: CLI & SDK

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

## 🧱 Maintaining this repo

<details>
<summary>Build pipeline & contribution flow</summary>

<br>

Single source of truth: `canonical/*.md` (shared markdown blocks) + `platforms/<name>/recipe.json` (which blocks, what frontmatter, what extras). A ~150-line build assembles every platform output under `dist/`.

```bash
npm install
npm run build       # regenerate dist/ for every built platform
npm test            # vitest — snapshot per platform + unit tests
npm test -- -u      # re-bless snapshots after an intentional content change
npm run check       # Biome lint + format
```

We only build the artifacts `npx skills add` **can't** produce — the two plugins, `cursor`, `copilot`, `hermes`, and the canonical root skill the CLI itself reads. Everything else is delegated to the CLI.

To change the knowledge (new tool, pricing, caveat): edit the relevant `canonical/*.md` block **once**, bump `version` in `canonical/_frontmatter.yml`, `npm run build`, re-bless snapshots, commit. Never hand-edit `dist/` (gitignored) or `skills/toomanycooks/SKILL.md` (generated) — fix the canonical source. CI mirrors the marketplace-bound outputs to their standalone repos ([MARKETPLACES.md](./MARKETPLACES.md)).

</details>

## License

MIT · built on [`@toomanycooks/mcp-server`](https://www.npmjs.com/package/@toomanycooks/mcp-server) · [toomanycooks.app](https://toomanycooks.app)
