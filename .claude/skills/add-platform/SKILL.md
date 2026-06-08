---
name: add-platform
description: Scaffold a new output platform for the Too Many Cooks skill build pipeline — creates platforms/<name>/recipe.json (+ optional header.md), then registers it in tests/build.test.ts so it gets snapshot coverage. Use when adding a new target format (a new editor, agent, or marketplace).
disable-model-invocation: true
---

# Add a platform

Adds one new output target to the canonical → `dist/` build pipeline. `scripts/build.ts`
auto-discovers any directory under `platforms/` that does not start with `_`, so the work is:
write a recipe, optionally a header, and register the platform in the test matrix.

## Inputs to gather first

- **Platform name** (kebab-case dir name, e.g. `windsurf`). Becomes `platforms/<name>/`.
- **Output path(s)** — where the primary artifact must land under `dist/<name>/...` for that
  tool to load it (e.g. `.cursor/rules/toomanycooks.mdc` for Cursor-like tools).
- **Which canonical blocks** it needs, in order. The full set lives in `canonical/`:
  `decision-tree`, `tool-reference`, `domain-knowledge`, `caveats`, `output-formatting`,
  `failure-modes`, `examples`, `advanced-workflows`, `personalization`.
- **Frontmatter / wrapping** the format expects (YAML frontmatter? a `## title` section wrapper?
  a `<tool name=…>` tag?).

If any of these is unknown, ask before scaffolding — guessing the output path ships a platform
the target tool silently won't load.

## Steps

1. **Create `platforms/<name>/recipe.json`.** Validated by Zod in `scripts/recipe-schema.ts`.
   Minimum shape:
   ```json
   {
     "outputPath": "dist/<name>/<path-the-tool-loads>",
     "blocks": ["decision-tree", "tool-reference", "domain-knowledge", "caveats", "output-formatting", "failure-modes", "examples"],
     "frontmatter": {
       "name": "toomanycooks",
       "description": "Use when the user asks about crypto perpetuals funding rates, delta-neutral arbitrage, perp/perp spreads, exchange support, or live Too Many Cooks market data via MCP.",
       "version": "$version"
     }
   }
   ```
   - The literal `"$version"` is substituted from `canonical/_frontmatter.yml` at build time — never hardcode the number.
   - Add `transforms` if the format needs section/tool-tag wrapping or frontmatter stripping
     (`wrap-section`, `wrap-tool-tag`, `strip-frontmatter`).
   - Add `extras` for an MCP config snippet (`mcp-snippet`, format `json`/`jsonc`/`yaml`),
     a plugin manifest, or copied slash commands. Mirror an existing platform whose layout
     matches — `platforms/hermes/recipe.json` (multi-output + agent-skills index) and
     `platforms/cursor/recipe.json` are good references.

2. **Optional `platforms/<name>/header.md`** — a platform-specific preamble prepended before the
   blocks. Only add if the format needs a custom intro.

3. **Register the platform in `tests/build.test.ts`.** Add an entry to the `PLATFORM_OUTPUTS`
   map keyed by the platform name, valued with its primary `outputPath`. **This is the step
   that's easy to forget — skipping it ships an untested platform.**

4. **Build and bless:**
   ```bash
   npm run build          # regenerates dist/<name>/
   npm test -- -u         # creates tests/snapshots/<name>.snap.md
   ```
   Inspect the generated artifact under `dist/<name>/` and the new snapshot to confirm the
   output is what the target tool expects.

5. **Update install docs.** `README.md` and `INSTALL.md` are the per-platform end-user install
   guides — add the new platform's file path + MCP config so users know where the artifact goes.

6. Run `npm run check` (Biome) and confirm `npm test` is green before committing. Do **not**
   commit `dist/` (gitignored).
