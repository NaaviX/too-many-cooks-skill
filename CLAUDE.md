# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This is the `skill/` repo — its **own** git repository (`git@gitlab.com:too-many-cooks/skill.git`),
> independent from the sibling `api/`, `front/`, `cronjob/` repos in the `too-many-cooks/` workspace.
> It ships **no runtime code**: it is a build pipeline (markdown + TypeScript scripts) that turns one
> canonical agent skill into per-platform skill/rule/plugin artifacts.

## What this repo produces

The Too Many Cooks **skill** (the agent *know-how* for using the `@toomanycooks/mcp-server` MCP
tools) declined into 8 platform formats: `claude-code-skill`, `claude-code-plugin`, `cursor`,
`cline`, `continue`, `codex`, `hermes`, `openclaw`. The MCP server itself lives elsewhere (npm
package); this repo only authors the prose/config that wraps it.

## Commands

```bash
npm install
npm run build           # tsx scripts/build.ts → regenerates dist/ for ALL platforms
npm test                # vitest: snapshot per platform + unit tests on the build
npm test -- -u          # re-bless snapshots after an intentional content change
npx vitest run tests/build.test.ts   # single test file
npm run check           # Biome lint + format (read-only)
npm run check:fix       # Biome autofix
npm run mirror -- --platform=<name> --repo=<git-url>   # push one dist/<platform> tree to a mirror repo
```

There is no separate compile step — scripts run via `tsx`; `tsconfig.json` is `noEmit` (type-check only).

## Architecture: canonical blocks + per-platform recipes → dist/

The single source of truth is **`canonical/*.md`** (shared content blocks) plus
**`platforms/<name>/recipe.json`** (which blocks, in what order, with what wrapping). `scripts/build.ts`
(~100 lines) assembles each platform; the rest of `scripts/` are its helpers.

```
canonical/_frontmatter.yml   ← single source of `version` (and name/description/homepage)
canonical/<block>.md         ← decision-tree, tool-reference, domain-knowledge, caveats,
                               output-formatting, failure-modes, examples, advanced-workflows
canonical/mcp-snippet.json   ← source for every platform's mcp-snippet extra
platforms/<name>/recipe.json ← the assembly instructions for one platform
platforms/<name>/header.md   ← optional platform-specific preamble, prepended before blocks
        │
        ▼  scripts/build.ts
dist/<name>/...              ← generated output (GITIGNORED — never hand-edit)
```

Per-platform build order in `build.ts`: read recipe → load base frontmatter → optional `header.md`
→ concatenate the named `canonical/<block>.md` files → apply `transforms` → inject `frontmatter`
(with `$version` substituted from `_frontmatter.yml`) → write `outputPath` → render `extras`.

### recipe.json shape (validated by Zod in `scripts/recipe-schema.ts`)

- `outputPath` (required) — where the primary artifact is written, relative to repo root.
- `blocks` (required) — ordered list of `canonical/<name>.md` basenames to concatenate.
- `frontmatter` (optional) — YAML frontmatter to inject. The literal string `"$version"` is
  replaced with the version from `_frontmatter.yml`.
- `transforms` (optional) — `wrap-section` (prepend `## title`), `wrap-tool-tag` (wrap in
  `<tool name=…>`), `strip-frontmatter`.
- `extras` (optional) — `plugin-manifest` (stamps version/name into `.claude-plugin/plugin.json`),
  `slash-commands` (copies a `commands/` dir), `mcp-snippet` (renders `canonical/mcp-snippet.json`
  as json/jsonc/yaml), `readme-snippet` (no-op; those chunks live in the repo README).

## Editing workflow (the thing that bites)

To change the skill's knowledge (new MCP tool, pricing, caveat, example):

1. Edit the relevant **`canonical/<block>.md` once** — all platforms that list that block inherit it.
2. Bump `version` in **`canonical/_frontmatter.yml`** if it's a meaningful release.
3. `npm run build` to regenerate `dist/`.
4. `npm test -- -u` to re-bless the per-platform snapshots (`tests/snapshots/*.snap.md`). Any
   canonical edit **will** fail the snapshot tests until re-blessed — that's expected, not a bug.
5. Commit. Do **not** commit `dist/` (gitignored) or hand-edit generated files; fix the canonical
   source or the recipe instead.

**One documented exception to "never commit generated":** the `agent-skills` platform writes
**outside** `dist/` to the *tracked* repo root — `skills/toomanycooks/SKILL.md` and
`mcp-snippet.json`. These ARE committed (so `npx skills add github.com/naavix/too-many-cooks-skill`
can read them straight from the source repo — there is **no mirror** for this platform). They are
still generated: after any `canonical/` edit, `npm run build` rewrites them, so re-commit them with
the snapshot re-bless. CI enforces this — `build.yml` runs `npm run build` then
`git diff --exit-code -- skills/ mcp-snippet.json`, so a `canonical/` edit committed without
rebuilding these fails the build. Never hand-edit `skills/toomanycooks/SKILL.md` — edit `canonical/`
instead. (Root `SKILL.md` is the separate hand-maintained standalone copy; don't confuse the two.)

To add a platform: create `platforms/<name>/recipe.json` (+ optional `header.md`); `build.ts`
auto-discovers any directory under `platforms/` not starting with `_`. Add it to `PLATFORM_OUTPUTS`
in `tests/build.test.ts` so it gets snapshot coverage.

## Conventions

- ESM (`"type": "module"`), `module: NodeNext`. Relative imports in `scripts/` use the **`.js`**
  extension even for `.ts` sources (`import … from "./extras.js"`).
- Biome formatting: **tabs**, width 100, double quotes, always semicolons. Biome ignores `dist/`,
  `node_modules/`, and snapshot internals.
- Input validation via **Zod** (recipe schema). Node >= 20.

## CI / distribution

- `.github/workflows/build.yml` — build + test on push/PR.
- `.github/workflows/mirror.yml` — on push to `main`, runs `scripts/mirror.ts` to push selected
  `dist/<platform>/` trees into standalone marketplace repos (matrix: `claude-code-plugin`,
  `cursor`). Auth via the `MIRROR_PUSH_TOKEN` secret. See `MARKETPLACES.md`.

## Notes

- `README.md` is the **end-user install guide** (per-platform file paths + MCP config); keep it in
  sync when output paths change. `AGENT.md` is a short maintainer brief overlapping this file.
- Root `SKILL.md` is a standalone hand-maintained copy of the skill; the canonical→`dist/` pipeline
  is the source of truth for the generated artifacts.
