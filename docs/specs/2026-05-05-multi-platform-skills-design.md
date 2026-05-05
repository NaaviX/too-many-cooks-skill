# Multi-platform skills — design spec

**Date:** 2026-05-05
**Status:** Approved (brainstorm), awaiting implementation plan
**Owner:** Antoine
**Repo affected:** `too-many-cooks/skill/`

---

## Goal

Decline the existing Too Many Cooks Claude Code skill (`skill/SKILL.md`) into companion skills/rules/presets for the major AI agent platforms, so any user of those platforms can install Too Many Cooks with one or two commands and get the same domain-aware behavior.

The skill teaches the agent *how* to use the `@toomanycooks/mcp-server` MCP server correctly (decision tree, caveats, output formatting). The MCP gives the tools; the skill gives the expertise. Today this exists only for Claude Code. v1 brings it to 6 more platforms.

## Non-goals (v1)

- GPT Store / ChatGPT custom GPT (requires OpenAPI actions, a separate transport — not just markdown).
- Self-hosting SKILL.md as MCP via SkillsOverMCP.
- Automated semantic tests (LLM-judge against a prompt panel).
- i18n. Everything ships in English (lingua franca for agents).
- Per-platform versioning. Single version source.
- Automated marketplace submissions (most marketplaces have no public API).
- OpenClaw is best-effort: if the AgentSkill format is poorly documented at implementation time, OpenClaw slips to v1.1 — the 6 other platforms ship without it.

## Target platforms (v1)

All Family 1 — *MCP already supported, only the know-how is ported*. None require a new API transport.

| Platform | Output location | Frontmatter / config |
|---|---|---|
| Claude Code skill *(already shipped)* | `~/.claude/skills/toomanycooks/SKILL.md` | YAML: `name`, `description` |
| Claude Code plugin | repo with `.claude-plugin/plugin.json` + `skills/toomanycooks/SKILL.md` + `commands/*.md` | `plugin.json` manifest (name, version, MCP server config) |
| Cursor | `.cursor/rules/toomanycooks.mdc` | YAML: `description`, `globs: []`, `alwaysApply: false` |
| Cline | `.clinerules/toomanycooks.md` | none |
| Continue.dev | `.continue/rules/toomanycooks.md` | YAML: `description` |
| Codex CLI | section block to paste into `AGENTS.md` + `~/.codex/mcp.json` snippet | none |
| Hermes | system prompt block + `mcp.json` snippet | none |
| OpenClaw | AgentSkill at OpenClaw's expected location | OpenClaw AgentSkill format (TBD at implementation; format will be confirmed against `docs.openclaw.ai`) |

Most outputs are direct canonical assembly + injected frontmatter. Cases that need extra processing:
- **Claude Code plugin** — needs a manifest and a few slash commands (`/tmc-arb`, `/tmc-rates`).
- **Codex** — section wrapper (`## Too Many Cooks`) so the block coexists with other `AGENTS.md` content.
- **Hermes** — light wrap so the block fits inside a system prompt context.
- **OpenClaw** — format-specific; verify against current docs at implementation time.

## Source-of-truth strategy (β — shared markdown blocks)

Single canonical content split into reusable blocks. Each platform declares a recipe of which blocks to assemble in which order, plus a platform-specific header for frontmatter / framing. A small Node TS build script concatenates and writes outputs.

Rationale for β over α (canonical + templating engine) and γ (manual duplication):
- α is over-engineered for 7 outputs that mostly want straight concatenation.
- γ guarantees drift the day pricing or tool reference changes.
- β is the sweet spot: DRY where it matters (the canonical knowledge) without a templating engine.

## Repo layout

Extend the existing `too-many-cooks/skill/` repo (it already lives in its own git repo).

```
skill/
├── canonical/                    # source of truth — reusable markdown blocks
│   ├── _frontmatter.yml          # name, description, version
│   ├── decision-tree.md
│   ├── tool-reference.md
│   ├── domain-knowledge.md
│   ├── caveats.md
│   ├── examples.md
│   ├── failure-modes.md
│   └── mcp-snippet.json          # canonical MCP server config snippet
├── platforms/                    # one folder per target
│   ├── claude-code-skill/
│   │   ├── recipe.json           # ordered list of canonical blocks + extras
│   │   └── header.md             # platform-specific markdown prefix
│   ├── claude-code-plugin/
│   │   ├── recipe.json
│   │   ├── plugin.manifest.json
│   │   ├── commands/             # /tmc-arb, /tmc-rates slash commands
│   │   └── header.md
│   ├── cursor/
│   ├── cline/
│   ├── continue/
│   ├── codex/
│   ├── hermes/
│   └── openclaw/
├── dist/                         # generated, gitignored
│   ├── claude-code-skill/SKILL.md
│   ├── claude-code-plugin/...
│   ├── cursor/.cursor/rules/toomanycooks.mdc
│   └── ...
├── scripts/
│   └── build.ts                  # ~150 lines, ESM, Node TS
├── tests/
│   └── build.test.ts             # snapshot per platform
├── package.json
├── tsconfig.json
├── biome.json
├── README.md                     # main install instructions for all platforms
├── MARKETPLACES.md               # living checklist of submissions
├── SKILL.md                      # legacy, removed once Claude Code skill ships from dist/
└── .github/workflows/
    ├── build.yml                 # build + test on push
    └── mirror.yml                # push dist/<platform>/ to mirror repo
```

## Build script

`scripts/build.ts`. Node TS, ESM, ~150 lines. Dependencies: `js-yaml`, `zod` (recipe validation).

Pseudocode:

```ts
for each platform in platforms/:
  recipe   = readJSON(`platforms/${platform}/recipe.json`)
  header   = readFile(`platforms/${platform}/header.md`)
  blocks   = recipe.blocks.map(b => readFile(`canonical/${b}.md`))
  body     = [header, ...blocks].join("\n\n")

  if recipe.frontmatter:
    body = injectFrontmatter(body, recipe.frontmatter, canonical/_frontmatter.yml)

  if recipe.transforms:
    body = applyTransforms(body, recipe.transforms)
    // e.g. wrap-in-section "## Too Many Cooks" for Codex
    // e.g. wrap-in-tool-tag for Hermes

  writeFile(recipe.outputPath, body)

  for each extra in recipe.extras:
    renderExtra(platform, extra)
    // e.g. plugin.json, slash commands, mcp.json snippets, README sections
```

`recipe.json` schema (zod-validated):

```ts
{
  outputPath: string,            // e.g. "dist/cursor/.cursor/rules/toomanycooks.mdc"
  blocks: string[],              // ordered list of canonical block names
  frontmatter?: Record<string, unknown>,  // platform-specific YAML frontmatter
  transforms?: Array<            // ordered transforms applied to body
    | { kind: "wrap-section", title: string }
    | { kind: "wrap-tool-tag", name: string }
    | { kind: "strip-frontmatter" }
  >,
  extras?: Array<
    | { kind: "plugin-manifest", source: string }
    | { kind: "slash-commands", source: string }
    | { kind: "mcp-snippet", format: "json" | "jsonc" | "yaml" }
    | { kind: "readme-snippet" }
  >,
}
```

## npm scripts

- `npm run build` — generate everything in `dist/`
- `npm run check` — Biome lint
- `npm run test` — Vitest (snapshot test per platform)
- `npm run mirror -- --platform=<name>` — push `dist/<platform>/` to the matching mirror repo (used by CI, runnable locally with a token)

## Tests

Snapshot test per platform output. Vitest with `toMatchFileSnapshot`. Any change in a `dist/*` output requires `vitest -u` to be re-blessed, which surfaces unintended cross-platform changes.

No integration tests (would require installing Cursor / Cline / etc.). Manual smoke test per platform once at v1 release; thereafter only when canonical blocks change.

## Distribution (D2-light)

Dedicated mirror repos only where a marketplace requires one:

- `toomanycooks-claude-plugin` — required for Claude Plugin Marketplace submission and `claudemarketplaces.com` listing.
- `toomanycooks-cursor` — required for `cursor.directory` PR submission.

Other platforms (Cline, Continue, Codex, Hermes, OpenClaw) — no mirror, install instructions live in the mono-repo README.

GitHub Action `mirror.yml` (on push to `main`):
1. `npm ci && npm run build && npm test`
2. For each mirrored platform: `git clone <mirror>`, rsync `dist/<platform>/` into it, commit `chore: sync from monorepo @ <sha>`, push using `MIRROR_PUSH_TOKEN` (PAT in repo secrets).
3. No-op silently if nothing changed.

Marketplaces submitted at v1 launch (manual, one-shot per marketplace, tracked in `MARKETPLACES.md`):
- Claude Plugin Marketplace (Anthropic) — submission form at `platform.claude.com/plugins/submit`.
- Cursor Directory (`cursor.directory`) — PR adding metadata pointing at `toomanycooks-cursor`.
- Aggregator listing on lobehub.com or skillsmp.com — one listing covers multiple platforms.

Other platforms reach users via README + `toomanycooks.app` site + launch announcement.

## Versioning & maintenance

Single version source: `canonical/_frontmatter.yml` carries `version: x.y.z`. Build injects it into:
- All platform frontmatters that support a version field
- The Claude Code plugin manifest
- A version badge in the README

Maintenance loop when the API or MCP changes (new tool, new exchange, pricing change):
1. Edit the relevant canonical block (`tool-reference.md`, `caveats.md`, etc.) — single edit.
2. Bump `version` in `_frontmatter.yml` per semver.
3. Commit & push.
4. CI: build + test + mirror push.
5. For listed marketplaces: most pick up the new version automatically from the mirrored repo. Claude Plugin Marketplace re-validates on version bump after first acceptance.

Snapshot tests fail on any output diff, forcing an explicit `vitest -u` and review.

## Naming

Slug `toomanycooks` everywhere (frontmatter `name`, file names, package names, MCP server entry name). User-facing display: *Too Many Cooks*.

## Risks / known unknowns

- **OpenClaw AgentSkill format** — verify against current docs at implementation time. Fallback: ship without OpenClaw in v1, add in v1.1.
- **Cursor frontmatter behavior** — `globs: []` + `alwaysApply: false` means the rule only activates via description-based matching. Confirm at implementation time that this is the right activation strategy for a domain skill (vs `alwaysApply: true`).
- **Claude Plugin Marketplace review SLA** — unknown turnaround, likely days-to-weeks. Submission should happen as soon as v1 builds cleanly.
- **Mirror PAT token rotation** — needs a `MIRROR_PUSH_TOKEN` repo secret with `repo` scope on the mirror repos. Document creation steps in repo README under "CI setup".

## Out of scope, restated for clarity

GPT Store, SkillsOverMCP hosting, semantic LLM-judge tests, i18n, per-platform versioning, automated marketplace submission, custom marketplace hosting. All deferred.
