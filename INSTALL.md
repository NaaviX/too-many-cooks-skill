# Installing Too Many Cooks on every platform

This is the end‑user install guide. For each AI agent it shows how to add the two
pieces that make up the integration:

1. **The MCP server** (`@toomanycooks/mcp-server`) — gives the agent the *tools*
   (`find_arbitrage_strategies`, `get_historical_funding`, `list_exchanges`, …).
   Launched on demand via `npx`, so there is **nothing to install globally**.
2. **The skill / rule** (this repo) — gives the agent the *know‑how*: which tool
   to reach for, how to read APRs, what caveats to surface. With it, the agent
   behaves like a quant analyst instead of calling tools blindly.

Some platforms bundle both in one install (Claude Code plugin); the rest take the
rule file and the MCP config separately.

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
| **Published marketplace / git** | Claude Code plugin, Cursor | Pull from the mirror repos — no clone needed |
| **Build from source** | everything else | Clone this repo, `npm run build`, copy the generated file from `dist/<platform>/` |

To build from source:

```bash
git clone git@gitlab.com:too-many-cooks/skill.git
cd skill && npm install && npm run build   # populates dist/ for all 8 platforms
```

---

## Claude Code — plugin (recommended)

One install bundles the skill, the MCP server, and three slash commands
(`/tmc-arb`, `/tmc-rates`, `/tmc-setup`). The plugin repo doubles as its own
marketplace.

```text
/plugin marketplace add naavix/toomanycooks-plugin
/plugin install toomanycooks@toomanycooks
```

On enable, Claude Code prompts for your `TMC_API_KEY` (declared as a `sensitive`
`userConfig` value and stored in the OS keychain) — no MCP config to hand‑edit.

Test a local build before publishing:

```bash
claude --plugin-dir ./dist/claude-code-plugin
```

---

## Claude Code / Claude Desktop — skill only (manual)

Use this if you want the know‑how without the plugin's slash commands.

1. **Skill** — copy the skill into your skills directory:

   ```bash
   mkdir -p ~/.claude/skills/toomanycooks
   cp dist/claude-code-skill/SKILL.md ~/.claude/skills/toomanycooks/
   ```

2. **MCP server** — add the server to your client config:

   - **Claude Code:** `claude mcp add-json toomanycooks '{"command":"npx","args":["-y","@toomanycooks/mcp-server"],"env":{"TMC_API_KEY":"tmc_live_..."}}'`
     (or drop a `.mcp.json` in your project root with the `mcpServers` block below).
   - **Claude Desktop:** edit `claude_desktop_config.json`
     (macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`)
     and add:

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

   Restart the client after editing.

---

## Cursor

1. **Rule** — copy the rule into your project (or globally to `~/.cursor/rules/`):

   ```bash
   mkdir -p .cursor/rules
   cp dist/cursor/.cursor/rules/toomanycooks.mdc .cursor/rules/
   ```

   (Or pull the prebuilt tree from the mirror repo `naavix/toomanycooks-cursor`,
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

## Cline

1. **Rule** — copy into your project:

   ```bash
   mkdir -p .clinerules
   cp dist/cline/.clinerules/toomanycooks.md .clinerules/
   ```

2. **MCP server** — in VS Code, open Cline → **MCP Servers → Configure** (edits
   `cline_mcp_settings.json`) and add the `toomanycooks` entry under
   `mcpServers` (same three fields as above). The ready‑made object is in
   `dist/cline/mcp-snippet.json`.

---

## Continue.dev

1. **Rule** — copy into your project:

   ```bash
   mkdir -p .continue/rules
   cp dist/continue/.continue/rules/toomanycooks.md .continue/rules/
   ```

2. **MCP server** — add the server to your Continue config
   (`~/.continue/config.yaml`, or the assistant's `config.json`). The fields
   match `dist/continue/mcp-snippet.json`:

   ```yaml
   mcpServers:
     - name: toomanycooks
       command: npx
       args: ["-y", "@toomanycooks/mcp-server"]
       env:
         TMC_API_KEY: tmc_live_...
   ```

---

## Codex CLI

1. **Know‑how** — paste the contents of `dist/codex/AGENTS.snippet.md` into your
   project's `AGENTS.md` (Codex reads it automatically).

2. **MCP server** — Codex stores MCP servers in `~/.codex/config.toml`:

   ```toml
   [mcp_servers.toomanycooks]
   command = "npx"
   args = ["-y", "@toomanycooks/mcp-server"]
   env = { TMC_API_KEY = "tmc_live_..." }
   ```

   The same three fields are shipped as JSON in `dist/codex/mcp-snippet.json` if
   your Codex version uses a JSON config instead.

---

## Hermes

1. **Know‑how** — paste `dist/hermes/system-prompt.md` into your agent's system
   prompt.

2. **MCP server** — register the server with your Hermes runtime using the fields
   from `dist/hermes/mcp-snippet.json` (the standard `command` / `args` / `env`
   object).

---

## OpenClaw

Copy the whole skill folder — it carries the know‑how and the MCP snippet
together:

```bash
cp -r dist/openclaw/skills/toomanycooks <your-openclaw-skills-dir>/
```

`SKILL.md` is the know‑how; `mcp-snippet.json` next to it is the server config to
register with OpenClaw.

---

## Verify it works

Once both pieces are in place, ask the agent:

- *"Show me the top 5 delta‑neutral arbitrage opportunities right now."*
- *"Compare BTC funding rates across HyperLiquid, Lighter, and Extended."*
- *"How has ETH funding evolved on HyperLiquid this past week?"*
- *"Which exchanges support stocks and forex perps?"*

If the agent calls a `toomanycooks` tool and returns live numbers, you're set. A
`401`/auth error means `TMC_API_KEY` is missing or wrong in the MCP `env`.

### Personalize the defaults (optional)

On the Claude Code plugin, run **`/tmc-setup`** once to choose your default
exchanges, liquidity floors, risk tolerance, result count, and funding window. It
writes `~/.toomanycooks/preferences.md`, which the skill reads on every query
(inline instructions in a prompt always override it). On other platforms, create
that same `key: value` file by hand — the skill picks it up automatically.

---

## Platform reference

| Platform | Know‑how file | MCP config target |
|---|---|---|
| Claude Code (plugin) | bundled — `/plugin install` | prompted at enable (`userConfig`) |
| Claude Code / Desktop (skill) | `~/.claude/skills/toomanycooks/SKILL.md` | `.mcp.json` / `claude_desktop_config.json` |
| Cursor | `.cursor/rules/toomanycooks.mdc` | `~/.cursor/mcp.json` |
| Cline | `.clinerules/toomanycooks.md` | `cline_mcp_settings.json` |
| Continue.dev | `.continue/rules/toomanycooks.md` | `~/.continue/config.yaml` |
| Codex CLI | paste into `AGENTS.md` | `~/.codex/config.toml` |
| Hermes | paste into system prompt | Hermes MCP runtime config |
| OpenClaw | `skills/toomanycooks/SKILL.md` | `skills/toomanycooks/mcp-snippet.json` |

> Maintainers: these paths are generated from `canonical/` + `platforms/<name>/recipe.json`.
> If an output path changes, update this file and `README.md` together. Marketplace
> mirroring is documented in [MARKETPLACES.md](./MARKETPLACES.md).
