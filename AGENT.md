# Too Many Cooks Skill Build

Build pipeline for the Too Many Cooks agent skill/rule artifacts across Claude Code,
Cursor, Cline, Continue, Codex, Hermes, and OpenClaw.

## Tech Stack

- Node.js 20+ with TypeScript ESM
- `tsx` for build scripts
- Vitest for tests and snapshots
- Biome for linting and formatting

## Commands

- `npm install` - Install dependencies.
- `npm run build` - Regenerate `dist/` artifacts for all platforms.
- `npm test` - Run the Vitest suite.
- `npm test -- -u` - Update snapshots after intentional generated-output changes.
- `npm run check` - Run Biome checks.
- `npm run check:fix` - Apply Biome fixes.
- `npm run mirror` - Mirror marketplace-bound outputs.

## Project Rules

- Treat `canonical/*.md` and `platforms/<name>/recipe.json` as the source of truth.
- Do not hand-edit generated files in `dist/`; change the canonical blocks or platform recipes, then run `npm run build`.
- When changing generated skill/rule text, run `npm run build` and `npm test`; update snapshots only when the output change is intentional.
- Keep platform-specific behavior in `platforms/<name>/` rather than duplicating canonical content.
- Preserve the MCP tool guidance in `SKILL.md` and the generated platform outputs: database-backed tools are preferred over live exchange calls.

