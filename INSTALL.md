# Installing Too Many Cooks on every platform

This is the end‑user install guide. For each AI agent it shows how to add the two
pieces that make up the integration:

1. **The MCP server** (`@toomanycooks/mcp-server`) — gives the agent the *tools*
   (`find_arbitrage_strategies`, `get_historical_funding`, `list_exchanges`, …).
   Launched on demand via `npx`, so there is **nothing to install globally**.
2. **The skill / rule** (this repo) — gives the agent the *know‑how*: which tool
   to reach for, how to read APRs, what caveats to surface. With it, the agent
   behaves like a quant analyst instead of calling tools blindly.

Most editors install the skill with one command — `npx skills add` (below) — and
take the MCP config separately. The two plugins (Claude Code, Codex) bundle both.

---

## Fast paths (start here)

Two one-line installs cover most users; everything below them is the manual
fallback for the remaining hosts.

- **Claude Code → plugin.** Bundles the skill, the MCP server, and the
  `/toomanycooks-help` / `/toomanycooks-setup` / `/toomanycooks-doctor` commands.
  Set your API key via `/plugin → Configure options` (required — the MCP won't
  start without it); no MCP config file to hand-edit.

  ```text
  /plugin marketplace add NaaviX/toomanycooks-plugin
  /plugin install toomanycooks@toomanycooks
  ```

- **Any other editor → `npx skills add`.** Cursor, Cline, Continue, Windsurf,
  Roo, Zed, Gemini, Junie, OpenClaw, Claude Code and ~60 more are supported
  targets. Pulls the skill straight from this repo (no clone). It installs the
  *know-how* only — add the MCP block once afterwards (see
  [Agent Skills](#agent-skills-npx-skills-add)).

  ```bash
  npx skills add https://github.com/NaaviX/too-many-cooks-skill
  ```

- **Building from source? Use the helper.** After `npm run build`, `./install.sh
  <platform>` copies the generated file to the right place and prints the MCP
  snippet to paste. `./install.sh --list` shows the platforms it handles.

---

## Step 0 — Get an API key (once, for all platforms)

Grab a free key (100 req/day) at <https://toomanycooks.app/dashboard/api-keys>.
It looks like `tmc_live_…`. Every config below references it as `TMC_API_KEY`.

The MCP server config is the **same three fields everywhere** — only the
surrounding wrapper changes per host:

```json
{
  "command": "npx",
  "args": ["-y", "@toomanycooks/mcp-server"],
  "env": { "TMC_API_KEY": "tmc_live_..." }
}
```

This exact object also ships next to every platform's output as
`mcp-snippet.json` (after `npm run build`).

---

## Where the files come from

| Install route | Platforms | How |
|---|---|---|
| **`npx skills add`** | Cursor, Cline, Continue, Windsurf, Roo, Zed, Gemini, Junie, OpenClaw, Claude Code, … | Pulls the skill from this repo — no clone, no build |
| **Published marketplace / git** | Claude Code plugin, Cursor | Pull from the mirror repos — no clone needed |
| **Build from source** | the plugins, Cursor, Copilot, Hermes | Clone this repo, `npm run build`, copy the generated file from `dist/<platform>/` (or use `./install.sh`) |

To build from source:

```bash
git clone git@gitlab.com:too-many-cooks/skill.git
cd skill && npm install && npm run build   # populates dist/ for every built platform
```

---

## Claude Code — plugin (recommended)

One install bundles the skill, the MCP server, and three slash commands
(`/toomanycooks-help`, `/toomanycooks-setup`, `/toomanycooks-doctor`). Data
queries go through the skill's own dispatch — `/toomanycooks rates BTC`,
`/toomanycooks arb 10`, …; `/toomanycooks-help` shows the full cheat-sheet.
The plugin repo doubles as its own marketplace.

```text
/plugin marketplace add NaaviX/toomanycooks-plugin
/plugin install toomanycooks@toomanycooks
```

**Set your API key — required, and the step people miss.** The `TMC_API_KEY` is a
`sensitive`, `required` `userConfig` value (stored in the OS keychain, never a plain
file). The plugin will **not** start its MCP server until it's set, and reports
*"Plugin option api_key isn't set"* until then. Set it via:

```text
/plugin → Too Many Cooks → Configure options → paste your tmc_live_… key
/reload-plugins
/mcp        # confirm the toomanycooks server is connected
```

Get a free key at https://toomanycooks.app/dashboard/api-keys. If the MCP tools
never show up, run **`/toomanycooks-doctor`** — it walks through the fix.

Test a local build before publishing:

```bash
claude --plugin-dir ./dist/claude-code-plugin
```

---

## Codex — plugin

Install the Codex plugin tree (`dist/codex-plugin/`) through a local/personal
Codex marketplace. It bundles the skill and the MCP config (`.mcp.json`), which
reads `TMC_API_KEY` from the environment that launches Codex — nothing to
hand-edit.

> Want the know-how *without* the plugin? Use `npx skills add` (Codex is a
> supported target) and add the MCP server to `~/.codex/config.toml`.

---

## Cursor

1. **Rule** — copy the rule into your project (or globally to `~/.cursor/rules/`):

   ```bash
   mkdir -p .cursor/rules
   cp dist/cursor/.cursor/rules/toomanycooks.mdc .cursor/rules/
   ```

   (Or pull the prebuilt tree from the mirror repo `NaaviX/toomanycooks-cursor`,
   which ships `.cursor/` + `mcp-snippet.json` ready to drop in.)

2. **MCP server** — add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json`
   (project):

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

   Cursor → Settings → MCP should then list **toomanycooks** as enabled.

---

## GitHub Copilot

1. **Instructions** — copy into your repo:

   ```bash
   mkdir -p .github
   cp dist/copilot/.github/copilot-instructions.md .github/
   ```

2. **MCP server** — add `toomanycooks` to `.vscode/mcp.json` (or your Copilot MCP
   settings) using the fields from `dist/copilot/mcp-snippet.json`.

---

## Hermes

1. **Skill** — copy the generated skill into your Hermes skills folder:

   ```bash
   mkdir -p ~/.hermes/skills/finance
   cp -r dist/hermes/skills/toomanycooks ~/.hermes/skills/finance/
   ```

   Hermes reads the `required_environment_variables` block in `SKILL.md` and
   prompts securely for `TMC_API_KEY` when needed. If you are wiring a hosted
   Hermes agent that only accepts prompt text, paste `dist/hermes/system-prompt.md`
   as a fallback.

2. **MCP server** — register the server with your Hermes runtime using the fields
   from `dist/hermes/mcp-snippet.json` (the standard `command` / `args` / `env`
   object).

3. **Share it** — publish the generated skill to a Hermes tap / Skills Hub repo:

   ```bash
   hermes skills publish dist/hermes/skills/toomanycooks --to github --repo NaaviX/toomanycooks-hermes-skills
   ```

   Or self-host discovery by serving `dist/hermes/.well-known/` from
   `https://toomanycooks.app/.well-known/`. The generated
   `agent-skills/index.json` includes the required SHA-256 digest, and the legacy
   `skills/index.json` is emitted for older installers.

---

## Agent Skills (`npx skills add`) — everything else

This is the install path for **every editor not listed above** — Cline, Continue,
Windsurf, Roo, Zed, Gemini, Junie, OpenClaw, Claude Code and ~60 more are
supported targets of the [`skills`](https://github.com/vercel-labs/skills) CLI. It
pulls the skill straight from this repo with one command — no clone, no build:

```bash
npx skills add https://github.com/NaaviX/too-many-cooks-skill          # the skill
npx skills add https://github.com/NaaviX/too-many-cooks-skill --skill toomanycooks
```

The CLI scans the repo's `skills/` folder and installs `skills/toomanycooks/SKILL.md`
into your agent's native skills location. Target one or more agents explicitly
with `-a` (e.g. `-a cline -a windsurf`); omit it to pick interactively. It
installs the **know-how only** — the `skills add` flow can't register an MCP
server, so add the MCP block once: the ready-made object is the repo-root
`mcp-snippet.json` (the standard `command` / `args` / `env` shape), registered
with your host's MCP config.

> No mirror repo here: `skills/toomanycooks/SKILL.md` and `mcp-snippet.json` are
> committed at the root of the source repo itself (generated by `npm run build`
> from `canonical/`), so `npx skills add` reads them straight from
> `NaaviX/too-many-cooks-skill`. To install from a local checkout instead, point
> the CLI at this directory: `npx skills add .`.

---

## Verify it works

Once both pieces are in place, ask the agent:

- *"Show me the top 5 delta‑neutral arbitrage opportunities right now."*
- *"Compare BTC funding rates across HyperLiquid, Lighter, and Extended."*
- *"How has ETH funding evolved on HyperLiquid this past week?"*
- *"Which exchanges support stocks and forex perps?"*

If the agent calls a `toomanycooks` tool and returns live numbers, you're set. A
`401`/auth error means `TMC_API_KEY` is missing or wrong in the MCP `env`.

Wherever the skill is exposed as a slash command, it also takes arguments:
`/toomanycooks rates BTC`, `/toomanycooks arb 10`, `/toomanycooks simulate ETH
lighter extended` — run `/toomanycooks` with no arguments to list all 15 actions.

### Personalize the defaults (optional)

On the Claude Code plugin, run **`/toomanycooks-setup`** once to choose your default
exchanges, liquidity floors, risk tolerance, result count, and funding window. It
writes `~/.toomanycooks/preferences.md`, which the skill reads on every query
(inline instructions in a prompt always override it). On other platforms, create
that same `key: value` file by hand — the skill picks it up automatically.

---

## Platform reference

| Platform | Know‑how file | MCP config target |
|---|---|---|
| Claude Code (plugin) | bundled — `/plugin install` | prompted at enable (`userConfig`) |
| Codex (plugin) | bundled — `dist/codex-plugin/` | `.mcp.json` reads `TMC_API_KEY` from env |
| Agent Skills (`npx skills add`) | `npx skills add github.com/NaaviX/too-many-cooks-skill` | repo-root `mcp-snippet.json` |
| Cursor | `.cursor/rules/toomanycooks.mdc` | `~/.cursor/mcp.json` |
| GitHub Copilot | `.github/copilot-instructions.md` | `.vscode/mcp.json` |
| Hermes | paste into system prompt | Hermes MCP runtime config |
| Everything else | via `npx skills add` | repo-root `mcp-snippet.json` |

> Maintainers: these paths are generated from `canonical/` + `platforms/<name>/recipe.json`.
> If an output path changes, update this file and `README.md` together. Marketplace
> mirroring is documented in [MARKETPLACES.md](./MARKETPLACES.md).
