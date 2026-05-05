# Too Many Cooks — Skills, rules & presets for AI agents

Drop the Too Many Cooks skill into your favorite AI agent and it becomes a quant-aware analyst for crypto perpetuals funding rates and delta-neutral arbitrage. Powered by the [`@toomanycooks/mcp-server`](https://github.com/toomanycooks/toomanycooks-mcp) MCP server backed by data from 25 DEX exchanges.

Without the skill, the agent has the MCP tools but no domain context. With it, the agent picks the right tool, knows the caveats (fees, liquidity, rate flips), formats arb tables correctly, and avoids the "live-fan-out" tools that don't scale.

## What's in this repo

A canonical knowledge source under `canonical/`, plus per-platform recipes in `platforms/<name>/` that get assembled by `scripts/build.ts` into the formats below.

| Platform | Output | Status |
|---|---|---|
| Claude Code skill | `~/.claude/skills/toomanycooks/SKILL.md` | ✅ |
| Claude Code plugin | bundled plugin (manifest + skill + slash commands) | ✅ |
| Cursor | `.cursor/rules/toomanycooks.mdc` | ✅ |
| Cline | `.clinerules/toomanycooks.md` | ✅ |
| Continue.dev | `.continue/rules/toomanycooks.md` | ✅ |
| Codex CLI | section to paste in `AGENTS.md` + `~/.codex/mcp.json` snippet | ✅ |
| Hermes | system prompt block + Hermes runtime `mcp.json` snippet | ✅ |
| OpenClaw | AgentSkill | ✅ |

## Get an API key

1. Sign up at https://toomanycooks.app
2. Dashboard → API Keys → create a key (Free tier: 100 req/day)
3. Upgrade to Starter / Pro / Quant if your agent runs hot

## Install

### Claude Code (skill)

```bash
mkdir -p ~/.claude/skills/toomanycooks
curl -fsSL https://raw.githubusercontent.com/toomanycooks/toomanycooks-skill/main/dist/claude-code-skill/SKILL.md \
  -o ~/.claude/skills/toomanycooks/SKILL.md
```

Add the MCP server to `claude_desktop_config.json` (or your Claude Code MCP config):

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

### Claude Code (plugin)

Available on the Claude Plugin Marketplace as `toomanycooks`. The plugin bundles the skill, the MCP server registration, and two slash commands (`/tmc-arb`, `/tmc-rates`).

Mirror repo: https://github.com/toomanycooks/toomanycooks-claude-plugin

### Cursor

Listed on https://cursor.directory as `toomanycooks`. Or install manually:

```bash
mkdir -p .cursor/rules
curl -fsSL https://raw.githubusercontent.com/toomanycooks/toomanycooks-cursor/main/.cursor/rules/toomanycooks.mdc \
  -o .cursor/rules/toomanycooks.mdc
```

Then add the MCP server to `~/.cursor/mcp.json` using the snippet above.

### Cline

```bash
mkdir -p .clinerules
curl -fsSL https://raw.githubusercontent.com/toomanycooks/toomanycooks-skill/main/dist/cline/.clinerules/toomanycooks.md \
  -o .clinerules/toomanycooks.md
```

Configure the MCP server in your Cline settings.

### Continue.dev

```bash
mkdir -p .continue/rules
curl -fsSL https://raw.githubusercontent.com/toomanycooks/toomanycooks-skill/main/dist/continue/.continue/rules/toomanycooks.md \
  -o .continue/rules/toomanycooks.md
```

### Codex CLI

1. Append the contents of `dist/codex/AGENTS.snippet.md` to your project's `AGENTS.md`.
2. Add the MCP server config from `dist/codex/mcp-snippet.json` to `~/.codex/mcp.json`.

### Hermes

1. Append the contents of `dist/hermes/system-prompt.md` to your Hermes agent system prompt.
2. Add the MCP server config from `dist/hermes/mcp-snippet.json` to your Hermes runtime config.

### OpenClaw

Drop `dist/openclaw/skills/toomanycooks/SKILL.md` (and its parent `toomanycooks/` directory) into your OpenClaw gateway's skills directory and register the MCP server using `dist/openclaw/skills/toomanycooks/mcp-snippet.json`.

## Develop

```bash
git clone https://github.com/toomanycooks/toomanycooks-skill
cd toomanycooks-skill
npm install
npm run build         # generate everything in dist/
npm test              # run snapshot + unit tests
npm run check         # lint
```

To add a new platform: create `platforms/<name>/recipe.json` (and optionally `header.md`), run `npm run build`, add a snapshot test under `tests/snapshots/`.

## Maintenance

When the API or the MCP server changes, edit the relevant block under `canonical/`, bump `version` in `canonical/_frontmatter.yml`, commit. CI rebuilds, runs snapshot tests (which fail loudly on output drift, forcing a deliberate `vitest -u`), and pushes to mirror repos.

## CI setup

The `mirror.yml` workflow needs a repo secret `MIRROR_PUSH_TOKEN`: a fine-grained GitHub PAT with `Contents: Read and write` on the mirrored repos (`toomanycooks-claude-plugin`, `toomanycooks-cursor`).

## License

MIT.
