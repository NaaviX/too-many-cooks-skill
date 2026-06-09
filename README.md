<div align="center">

# 🍳 Too Many Cooks — agent skill

**Crypto perpetuals funding rates & delta-neutral arbitrage across 25 DEX exchanges — for every major AI agent.**

[![version](https://img.shields.io/badge/version-1.4.0-2563eb)](./canonical/_frontmatter.yml)
[![npm: mcp-server](https://img.shields.io/npm/v/@toomanycooks/mcp-server?label=mcp-server&color=cb3837)](https://www.npmjs.com/package/@toomanycooks/mcp-server)
[![license](https://img.shields.io/badge/license-MIT-22c55e)](#license)
[![install](https://img.shields.io/badge/install-npx%20skills%20add-000000)](#2-pick-your-platform)

</div>

---

Every integration is **two pieces**:

| Piece | What it is | What it does |
|---|---|---|
| 🔌 **MCP server** | `@toomanycooks/mcp-server` (npm) | Gives the agent the *tools* — `find_arbitrage_strategies`, `get_historical_funding`, `list_exchanges`, … |
| 🧠 **The skill** | *this repo* | Gives the agent the *know-how* — which tool to reach for, how to read APRs, what caveats to surface. The agent acts like a quant analyst instead of calling tools blindly. |

## 🚀 Install

Three steps: **get a key → pick your platform → add the MCP server.**

### 1. Get a free API key

100 req/day at **[toomanycooks.app/dashboard/api-keys](https://toomanycooks.app/dashboard/api-keys)**. It looks like `tmc_live_…` — every config below calls it `TMC_API_KEY`.

### 2. Pick your platform

**Click your tool to jump to its steps.** Not sure? Use [Any other editor](#any-other-editor) — one command covers ~70 agents.

| Your tool | Setup | Bundles the MCP server? |
|---|---|:---:|
| 🟣 [**Claude Code**](#claude-code) | plugin marketplace | ✅ |
| ⚫ [**Codex**](#codex) | plugin marketplace | ✅ |
| 🔵 [**Cursor**](#cursor) | rule file | — |
| 🐙 [**GitHub Copilot**](#github-copilot) | instructions file | — |
| 🟠 [**Hermes**](#hermes) | skill file | — |
| ✨ [**Any other editor**](#any-other-editor) | `npx skills add` | — |

<sub>**Any other editor** = Cline · Continue · Windsurf · Roo · Zed · Gemini · Junie · OpenClaw · Claude Code · and ~60 more.</sub>

#### Claude Code

> ⭐ **Recommended.** One install bundles the skill, the MCP server, and the `/toomanycooks-help`, `/toomanycooks-setup`, and `/toomanycooks-doctor` commands — no MCP config to hand-edit (skip step 3). Data queries run through `/toomanycooks <action>` (see [What you can ask](#-what-you-can-ask)).

```text
/plugin marketplace add NaaviX/toomanycooks-plugin
/plugin install toomanycooks@toomanycooks
```

> 🔑 **Then set your key (required):** `/plugin` → **Too Many Cooks → Configure options** → paste your `tmc_live_…` key, then `/reload-plugins`. The MCP server won't start until it's set (it shows *"Plugin option api_key isn't set"*). Stuck? Run **`/toomanycooks-doctor`**.

#### Codex

Install the plugin tree `dist/codex-plugin/` via a local/personal Codex marketplace — it bundles the skill and `.mcp.json` (reads `TMC_API_KEY` from the launching environment), so you can skip step 3. Just want the skill? Use [`npx skills add`](#any-other-editor) — Codex is a supported target.

#### Cursor

```bash
npm install && npm run build
./install.sh cursor    # copies the rule, then prints your step-3 snippet
```

Drops the rule into `.cursor/rules/`. Add the printed block to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project) — see step 3.

#### GitHub Copilot

```bash
npm install && npm run build
./install.sh copilot   # copies instructions, then prints your step-3 snippet
```

Drops `.github/copilot-instructions.md`. Add the printed block to `.vscode/mcp.json` — see step 3.

#### Hermes

```bash
npm install && npm run build
./install.sh hermes
```

Hermes reads the `required_environment_variables` block in `SKILL.md` and prompts for `TMC_API_KEY`. A `.well-known/` discovery tree is also generated — details in [INSTALL.md](./INSTALL.md#hermes).

#### Any other editor

Cline, Continue, Windsurf, Roo, Zed, Gemini, Junie, OpenClaw, Claude Code and ~60 more are supported targets of the [`skills`](https://github.com/vercel-labs/skills) CLI. It pulls the skill straight from this repo — no clone, no build:

```bash
npx skills add github.com/NaaviX/too-many-cooks-skill
# pick specific agents:  npx skills add github.com/NaaviX/too-many-cooks-skill -a cline -a windsurf
```

This installs the **know-how only** — finish with step 3.

### 3. Add the MCP server

The two **plugins** do this for you. Everywhere else, register this object once (every built platform also ships it as `mcp-snippet.json`):

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

**Slash shortcuts:** wherever the skill is exposed as a slash command, `/toomanycooks <action>` dispatches straight to the right tool — e.g. `/toomanycooks rates BTC`, `/toomanycooks arb 10 hyperliquid,lighter`, `/toomanycooks simulate ETH lighter extended 25000 60`. Run `/toomanycooks` with no arguments to list all 15 actions.

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

To change the knowledge (new tool, pricing, caveat): edit the relevant `canonical/*.md` block **once**, bump `version` in `canonical/_frontmatter.yml`, `npm run build`, re-bless snapshots, commit. The build also stamps the version into this README's badge and `docs.html`, so never edit those version strings by hand. Never hand-edit `dist/` (gitignored) or `skills/toomanycooks/SKILL.md` (generated) — fix the canonical source. CI mirrors the marketplace-bound outputs to their standalone repos ([MARKETPLACES.md](./MARKETPLACES.md)).

A visual tour of the pipeline (French) lives in [docs.html](./docs.html) — open it in a browser.

</details>

## License

MIT · built on [`@toomanycooks/mcp-server`](https://www.npmjs.com/package/@toomanycooks/mcp-server) · [toomanycooks.app](https://toomanycooks.app)
