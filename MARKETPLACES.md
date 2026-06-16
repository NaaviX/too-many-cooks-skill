# Marketplace submission checklist

Living tracker for where Too Many Cooks is listed. Update the status column when
a submission is filed or accepted. Versions come from `canonical/_frontmatter.yml`.

## Requires a dedicated mirror repo

| Marketplace | Mirror repo | Source `dist/` | Status |
|---|---|---|---|
| Claude Plugin Marketplace (`claude.ai/settings/plugins/submit`) | `NaaviX/toomanycooks-plugin` | `dist/claude-code-plugin/` | ☐ mirror live @ 1.5.0 (synced `387fed1`) — submit via form |
| Cursor Directory (`cursor.directory`, "Submit" form) | `NaaviX/toomanycooks-cursor` | `dist/cursor/` | ☐ mirror live @ 1.5.0 (synced `387fed1`) — submit via form |

Both mirror repos are **live and auto-fed** by `.github/workflows/mirror.yml` on
every push to `main` (needs the `MIRROR_PUSH_TOKEN` secret; the source repo must
be the GitHub-hosted `NaaviX/too-many-cooks-skill`, since the GitLab origin does
not run GitHub Actions). Each marketplace is submitted via its **website form**
(not a PR), pointing at the relevant mirror.

### Submission payloads (prepared 2026-06-07, refreshed 2026-06-14 @ 1.5.0)

**Claude community marketplace** — form at `claude.ai/settings/plugins/submit`
(aka `platform.claude.com/plugins/submit` / `clau.de/plugin-directory-submission`).
Point it at marketplace repo **`NaaviX/toomanycooks-plugin`**; it reads
`.claude-plugin/marketplace.json` → plugin `toomanycooks` @ `1.5.0`. Anthropic
runs an automated security scan + review; approved plugins are pinned by SHA and
auto-bumped on push.

**Cursor Directory** — "Submit" form at `cursor.directory`:
- Name: **Too Many Cooks**
- One-line: *Crypto perpetuals funding rates + delta-neutral arbitrage across 25 DEX exchanges via the Too Many Cooks MCP server.*
- Tools: **22** · Transport: **stdio** · Auth: **API key** (`TMC_API_KEY`, env)
- Repo: `https://www.npmjs.com/package/@toomanycooks/mcp-server` · Homepage: `https://toomanycooks.app`
- Config snippet: `NaaviX/toomanycooks-cursor` → `mcp-snippet.json`

The `claude-code-plugin` mirror is a **working plugin marketplace** on its own:
`dist/claude-code-plugin/` ships `.claude-plugin/marketplace.json` (catalog) next
to `.claude-plugin/plugin.json` (the plugin, `source: "."`). So before any
official submission, anyone can already install it directly:

```text
/plugin marketplace add NaaviX/toomanycooks-plugin
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
| Agent Skills (`npx skills add`) | `npx skills add NaaviX/too-many-cooks-skill` — reads the **committed** `skills/toomanycooks/SKILL.md` + `mcp-snippet.json` at the source repo root (built from `canonical/`, not mirrored) | ✅ served from source repo |
| `skills.sh` directory | Auto-listed: no form. A skill appears once it's in a public GitHub repo with a valid `SKILL.md`; ranking is by installs via the CLI above. Verified installable 2026-06-14 (`npx skills add NaaviX/too-many-cooks-skill` → 1 skill, 71 agents) | ✅ live — drive installs |
| `askill.sh` | Explicit submit form at `askill.sh/submit` (payload below) | ☐ not submitted |
| Tessl registry (`tessl.io/registry`) | Package-manager-style registry for agent skills; submit/publish per their docs | ☐ not submitted |
| `skills.re` (Registry of Agent Skills) | Aggregator listing, links back to this repo | ☐ not submitted |
| Aggregator (lobehub.com **or** skillsmp.com) | One listing, links back to this repo | ☐ not submitted |
| Hermes — Skills Hub / tap repo | `hermes skills publish dist/hermes/skills/toomanycooks --to github --repo NaaviX/toomanycooks-hermes-skills` | ☐ not published |
| Hermes / Agent Skills well-known | Serve `dist/hermes/.well-known/agent-skills/` from `toomanycooks.app` | ☐ not deployed |
| Legacy skills well-known | Serve `dist/hermes/.well-known/skills/index.json` for older installers | ☐ not deployed |
| Hermes — `NousResearch/hermes-agent` PR under `optional-skills/` | Direct PR for official visibility | ☐ not submitted |
| Cline / Continue.dev / Codex CLI / OpenClaw | README copy-paste install | n/a (docs only) |
| Codex plugin | `dist/codex-plugin/` via personal Codex marketplace | local install ready |

### Aggregator submission payloads (no mirror — point at source repo)

Reuse these for `askill.sh/submit`, `tessl.io/registry`, `skills.re`, lobehub:

- **Name:** Too Many Cooks
- **Slug / id:** `toomanycooks`
- **One-line:** *Query crypto perpetuals funding rates and find delta-neutral arbitrage across 25 DEX exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …) via the Too Many Cooks MCP server.*
- **Category / tags:** crypto, trading, funding-rates, delta-neutral, arbitrage, MCP, perpetuals
- **Repo:** `https://github.com/NaaviX/too-many-cooks-skill`
- **Install:** `npx skills add NaaviX/too-many-cooks-skill`
- **MCP package:** `https://www.npmjs.com/package/@toomanycooks/mcp-server` · **Tools:** 22 · **Transport:** stdio · **Auth:** API key (`TMC_API_KEY`, env)
- **Homepage:** `https://toomanycooks.app` · **Get a key:** `https://toomanycooks.app/dashboard/api-keys`
- **License/author:** see repo

## CI setup (one-time) — ✅ done 2026-06-07

1. ✅ Created `NaaviX/toomanycooks-plugin` and `NaaviX/toomanycooks-cursor`.
2. ✅ PAT created; added as the `MIRROR_PUSH_TOKEN` secret on `NaaviX/too-many-cooks-skill`.
3. ✅ Push to `main` → `mirror.yml` populates both. Both verified live @ 1.5.0
   (synced from monorepo `387fed1`, last checked 2026-06-14; `build` + `mirror`
   Actions green).

Note: the GitHub Actions workflows only run on the GitHub-hosted
`NaaviX/too-many-cooks-skill` repo, not the GitLab origin. Keep that repo in sync
(push-mirror or a second remote) for CI to fire.
