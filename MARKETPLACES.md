# Marketplace submission checklist

Living tracker for where Too Many Cooks is listed. Update the status column when
a submission is filed or accepted. Versions come from `canonical/_frontmatter.yml`.

## Requires a dedicated mirror repo

| Marketplace | Mirror repo | Source `dist/` | Status |
|---|---|---|---|
| Claude Plugin Marketplace (`claude.ai/settings/plugins/submit`) | `naavix/toomanycooks-plugin` | `dist/claude-code-plugin/` | ☐ mirror live @ 1.2.0 — submit via form |
| Cursor Directory (`cursor.directory`, "Submit" form) | `naavix/toomanycooks-cursor` | `dist/cursor/` | ☐ mirror live @ 1.2.0 — submit via form |

Both mirror repos are **live and auto-fed** by `.github/workflows/mirror.yml` on
every push to `main` (needs the `MIRROR_PUSH_TOKEN` secret; the source repo must
be the GitHub-hosted `naavix/too-many-cooks-skill`, since the GitLab origin does
not run GitHub Actions). Each marketplace is submitted via its **website form**
(not a PR), pointing at the relevant mirror.

### Submission payloads (prepared 2026-06-07)

**Claude community marketplace** — form at `claude.ai/settings/plugins/submit`
(aka `platform.claude.com/plugins/submit` / `clau.de/plugin-directory-submission`).
Point it at marketplace repo **`naavix/toomanycooks-plugin`**; it reads
`.claude-plugin/marketplace.json` → plugin `toomanycooks` @ `1.2.0`. Anthropic
runs an automated security scan + review; approved plugins are pinned by SHA and
auto-bumped on push.

**Cursor Directory** — "Submit" form at `cursor.directory`:
- Name: **Too Many Cooks**
- One-line: *Crypto perpetuals funding rates + delta-neutral arbitrage across 25 DEX exchanges via the Too Many Cooks MCP server.*
- Tools: **22** · Transport: **stdio** · Auth: **API key** (`TMC_API_KEY`, env)
- Repo: `https://www.npmjs.com/package/@toomanycooks/mcp-server` · Homepage: `https://toomanycooks.app`
- Config snippet: `naavix/toomanycooks-cursor` → `mcp-snippet.json`

The `claude-code-plugin` mirror is a **working plugin marketplace** on its own:
`dist/claude-code-plugin/` ships `.claude-plugin/marketplace.json` (catalog) next
to `.claude-plugin/plugin.json` (the plugin, `source: "."`). So before any
official submission, anyone can already install it directly:

```text
/plugin marketplace add naavix/toomanycooks-plugin
/plugin install toomanycooks@toomanycooks
```

CI gates this with `claude plugin validate dist/claude-code-plugin --strict`
(in `build.yml`) — the same check the community review pipeline runs. To submit
to Anthropic's `claude-community` marketplace, use the form at
`platform.claude.com/plugins/submit` (or `claude.ai/settings/plugins/submit`);
approved plugins are pinned by commit SHA and bumped automatically on push.

## No mirror required (install via README / direct tap)

| Channel | How | Status |
|---|---|---|
| Agent Skills (`npx skills add`) | `npx skills add https://github.com/naavix/too-many-cooks-skill` — reads the **committed** `skills/toomanycooks/SKILL.md` + `mcp-snippet.json` at the source repo root (built from `canonical/`, not mirrored) | ✅ served from source repo |
| Aggregator (lobehub.com **or** skillsmp.com) | One listing, links back to this repo | ☐ not submitted |
| Hermes — Skills Hub / tap repo | `hermes skills publish dist/hermes/skills/toomanycooks --to github --repo naavix/toomanycooks-hermes-skills` | ☐ not published |
| Hermes / Agent Skills well-known | Serve `dist/hermes/.well-known/agent-skills/` from `toomanycooks.app` | ☐ not deployed |
| Legacy skills well-known | Serve `dist/hermes/.well-known/skills/index.json` for older installers | ☐ not deployed |
| `skills.sh` | List the GitHub skill repo once published | ☐ not submitted |
| Hermes — `NousResearch/hermes-agent` PR under `optional-skills/` | Direct PR for official visibility | ☐ not submitted |
| Cline / Continue.dev / Codex CLI / OpenClaw | README copy-paste install | n/a (docs only) |
| Codex plugin | `dist/codex-plugin/` via personal Codex marketplace | local install ready |

## CI setup (one-time) — ✅ done 2026-06-07

1. ✅ Created `naavix/toomanycooks-plugin` and `naavix/toomanycooks-cursor`.
2. ✅ PAT created; added as the `MIRROR_PUSH_TOKEN` secret on `naavix/too-many-cooks-skill`.
3. ✅ Push to `main` → `mirror.yml` populates both. Both verified live @ 1.2.0.

Note: the GitHub Actions workflows only run on the GitHub-hosted
`naavix/too-many-cooks-skill` repo, not the GitLab origin. Keep that repo in sync
(push-mirror or a second remote) for CI to fire.
