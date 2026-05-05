# Multi-platform skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node TS pipeline in `too-many-cooks/skill/` that takes a single canonical knowledge source, assembles per-platform skills/rules/presets via simple recipes, generates 8 outputs (Claude Code skill, Claude plugin, Cursor, Cline, Continue, Codex, Hermes, OpenClaw), publishes via GitHub Actions to mirror repos for marketplace distribution, and surfaces install instructions per platform in the README.

**Architecture:** Mono-repo `too-many-cooks/skill/` extended with `canonical/` (markdown blocks shared across platforms), `platforms/<name>/` (per-platform recipes + headers + extras), `dist/` (generated). A ~150-line Node TS build script reads `recipe.json` per platform, concatenates canonical blocks with the platform header, applies optional transforms (e.g. wrap-section for Codex), injects platform frontmatter, then renders extras (plugin manifests, slash commands, MCP snippets). Vitest snapshot tests freeze each output. GitHub Actions push `dist/<platform>/` to mirror repos for marketplaces requiring a dedicated repo.

**Tech Stack:** Node 20+, TypeScript ESM, Biome (lint+format), Vitest (snapshot tests), `js-yaml`, `zod`, GitHub Actions.

---

## Reference: spec

Full design at `docs/specs/2026-05-05-multi-platform-skills-design.md`. This plan implements that spec verbatim.

## Reference: existing skill content

The current `skill/SKILL.md` is the source of truth for the canonical content. The first phase of this plan (Task 2) splits that content into reusable blocks under `canonical/`. The legacy `SKILL.md` stays in place during development; the last task (Task 22) removes it once the build pipeline produces an equivalent output.

---

### Task 1: Project setup (Node TS workspace)

**Files:**
- Create: `skill/package.json`
- Create: `skill/tsconfig.json`
- Create: `skill/biome.json`
- Create: `skill/.gitignore`
- Create: `skill/vitest.config.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@toomanycooks/skills-build",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsx scripts/build.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "mirror": "tsx scripts/mirror.ts"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20.14.0",
    "js-yaml": "^4.1.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "vitest": "^2.1.0",
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "noEmit": true
  },
  "include": ["scripts/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignore": ["dist/**", "node_modules/**"] },
  "formatter": { "enabled": true, "indentStyle": "tab", "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
*.log
.DS_Store
```

- [ ] **Step 5: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/**/*.test.ts"],
		globals: false,
	},
});
```

- [ ] **Step 6: Install dependencies**

Run: `cd skill && npm install`
Expected: install succeeds, `node_modules/` and `package-lock.json` created.

- [ ] **Step 7: Verify lint passes on empty repo**

Run: `cd skill && npm run check`
Expected: PASS, no files to check or all checks pass.

- [ ] **Step 8: Commit**

```bash
cd skill
git add package.json package-lock.json tsconfig.json biome.json .gitignore vitest.config.ts
git commit -m "chore: scaffold node ts workspace for multi-platform skills build"
```

---

### Task 2: Extract canonical blocks from existing SKILL.md

**Files:**
- Create: `skill/canonical/_frontmatter.yml`
- Create: `skill/canonical/decision-tree.md`
- Create: `skill/canonical/tool-reference.md`
- Create: `skill/canonical/domain-knowledge.md`
- Create: `skill/canonical/caveats.md`
- Create: `skill/canonical/output-formatting.md`
- Create: `skill/canonical/examples.md`
- Create: `skill/canonical/failure-modes.md`
- Create: `skill/canonical/advanced-workflows.md`
- Create: `skill/canonical/mcp-snippet.json`

This task splits the existing `SKILL.md` content into reusable blocks. The legacy `SKILL.md` stays untouched until Task 22.

- [ ] **Step 1: Create canonical/_frontmatter.yml**

```yaml
name: toomanycooks
displayName: Too Many Cooks
version: 1.0.0
description: Query crypto perpetuals funding rates and find delta-neutral arbitrage across 25 DEX exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …) via the Too Many Cooks API. Triggers on funding-rate, delta-neutral, perp/perp spread, or "best arb right now"-type questions.
homepage: https://toomanycooks.app
license: MIT
```

- [ ] **Step 2: Create canonical/decision-tree.md**

```markdown
## Quick decision tree

- "Best arb / what to trade / compare exchanges for ticker X" → `find_arbitrage_strategies`
- "How has rate evolved on exchange Y" → `get_historical_funding`
- "Current rate of X on Y" → `get_historical_funding` with `periodDays: 1`, take the most recent point
- "Which exchanges are supported" → `list_exchanges`
- Auth/quota debug → `whoami`
```

- [ ] **Step 3: Create canonical/tool-reference.md**

```markdown
## Tool reference

### Use these (database-backed)

| Tool | When | Useful args |
|---|---|---|
| `list_exchanges` | Need a valid exchange key, or user asks what's supported | — |
| `get_historical_funding` | Rate evolution over time, or "current rate" via the latest point | `exchange`, `tickers: []`, `periodDays` |
| `find_arbitrage_strategies` | **Default for arbitrage questions.** | `count`, `exchanges: []`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays` |
| `whoami` | Auth debug, quota report | — |

### Do NOT use

| Tool | Why | Reroute to |
|---|---|---|
| `get_funding_rates` | Hits live exchange APIs — slow, unaligned, not the supported path | `get_historical_funding` (latest point) |
| `compare_exchanges_for_ticker` | Same problem (live fan-out) | `get_historical_funding` per exchange in parallel, or `find_arbitrage_strategies` with `exchanges: [...]` |

The DB stores periodically-collected, time-aligned, deduped snapshots. Live-exchange queries are for ingestion, not analysis.

### Hard argument constraints

- `tickers` must be **UPPERCASE strings**, **1–20 per call** (e.g. `["BTC", "ETH"]`, never `["btc"]`).
- `count` ≤ **50**, `periodDays` ≤ **30**. Anything larger is rejected.
- Exchange keys are lowercase (e.g. `"hyperliquid"`, `"edgex"`). Get them from `list_exchanges` if unsure — never invent.
- `list_exchanges` returns a `supportsRWA` flag — filter on it when the user asks about stocks, forex, or commodities perps.
```

- [ ] **Step 4: Create canonical/domain-knowledge.md**

```markdown
## Non-obvious domain knowledge

- **APRs are returned as decimals** — `0.15` = 15% APR. Multiply by 100 only at display time.
- **Delta-neutral arb**: long the lowest funding APR (pay less / earn more), short the highest (receive funding). Spread = strategy APR.
- **`profitAPR` ≠ `shortFundingRateAPR − longFundingRateAPR`** in general. `profitAPR` is the *average* spread over the `periodDays` lookback window; the long/short rates are the *latest* snapshot. They diverge when rates have moved.
```

- [ ] **Step 5: Create canonical/caveats.md**

```markdown
## Caveats to mention proactively

1. **Gross of fees** — trading fees, gas, withdrawals eat the spread.
2. **Rates flip** — a +30% APR today can be −10% tomorrow. Active monitoring required.
3. **Liquidity matters** — high APR on $50k OI is meaningless (slippage). Apply `minVolume24h: 1000000`, `minOpenInterest: 1000000` when relevance matters.
4. **Not financial advice** — surface market structure, don't recommend trades.
```

- [ ] **Step 6: Create canonical/output-formatting.md**

````markdown
## Output formatting

Arb opportunities → compact table:

```
Ticker | Long → Short          | Profit APR
BTC    | hyperliquid → aster   | +28.4%
ETH    | lighter → extended    | +19.2%
```

Funding rate history → sort by absolute APR of the latest point (most extreme first), not alphabetical or chronological. Summarize (mean / max / min / volatility); don't dump raw points.
````

- [ ] **Step 7: Create canonical/examples.md**

```markdown
## Example interactions

**"Top 5 arbs right now"** → `find_arbitrage_strategies` with `count: 5`. Render table. Mention liquidity caveat.

**"Compare BTC across HL, Lighter, Extended"** → `get_historical_funding` per exchange in parallel (latest point each), or `find_arbitrage_strategies` with `exchanges: ["hyperliquid", "lighter", "extended"]` if they want the long/short pair. **Do not** use `compare_exchanges_for_ticker`.

**"Has ETH funding been stable on HL this week?"** → `get_historical_funding`, `exchange: "hyperliquid"`, `tickers: ["ETH"]`, `periodDays: 7`. Summarize stats; don't dump points.

**"Current BTC funding on HyperLiquid?"** → `get_historical_funding`, `tickers: ["BTC"]`, `periodDays: 1`. Take latest point. **Do not** use `get_funding_rates`.

**"What's an arbitrage strategy?"** → Explain the long-low/short-high mechanic. Optionally call `find_arbitrage_strategies` with `count: 3` to ground the explanation.
```

- [ ] **Step 8: Create canonical/failure-modes.md**

```markdown
## Failure modes

- **Auth error** → user should check `TMC_API_KEY` in their MCP config.
- **429 / quota** → suggest waiting for reset or upgrading at https://toomanycooks.app/pricing.
- **Empty strategy results** → volume/OI filters likely too tight; suggest relaxing them.
```

- [ ] **Step 9: Create canonical/advanced-workflows.md**

```markdown
## Advanced workflows

For multi-step analysis (multi-ticker screens, funding-flip detection, backtesting a delta-neutral pair, realized-PnL reconstruction), see the recipes reference. Load it on demand — not for one-off lookups.
```

- [ ] **Step 10: Create canonical/mcp-snippet.json**

```json
{
	"command": "npx",
	"args": ["-y", "@toomanycooks/mcp-server"],
	"env": {
		"TMC_API_KEY": "tmc_live_..."
	}
}
```

- [ ] **Step 11: Verify byte-equivalence with current SKILL.md**

Run a quick assembly to confirm canonical blocks reproduce the existing skill body when concatenated:

```bash
cd skill
cat canonical/decision-tree.md canonical/tool-reference.md canonical/domain-knowledge.md \
    canonical/caveats.md canonical/output-formatting.md canonical/examples.md \
    canonical/failure-modes.md canonical/advanced-workflows.md > /tmp/assembled.md
diff <(sed -n '/^## Quick decision tree/,$p' SKILL.md) /tmp/assembled.md | head -40
```

Expected: small differences only in section ordering and the "Advanced workflows" section (link path adjusted because the README rewrite happens later). No content drift on the substantive blocks.

- [ ] **Step 12: Commit**

```bash
cd skill
git add canonical/
git commit -m "feat: extract canonical knowledge blocks from SKILL.md"
```

---

### Task 3: Recipe schema (zod) + unit tests

**Files:**
- Create: `skill/scripts/recipe-schema.ts`
- Create: `skill/tests/recipe-schema.test.ts`

- [ ] **Step 1: Write failing test**

`skill/tests/recipe-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { RecipeSchema } from "../scripts/recipe-schema.js";

describe("RecipeSchema", () => {
	it("accepts a minimal recipe", () => {
		const parsed = RecipeSchema.parse({
			outputPath: "dist/foo/bar.md",
			blocks: ["decision-tree", "tool-reference"],
		});
		expect(parsed.blocks).toEqual(["decision-tree", "tool-reference"]);
	});

	it("accepts frontmatter as an arbitrary record", () => {
		const parsed = RecipeSchema.parse({
			outputPath: "dist/cursor/.cursor/rules/x.mdc",
			blocks: ["tool-reference"],
			frontmatter: { description: "x", globs: [], alwaysApply: false },
		});
		expect(parsed.frontmatter?.alwaysApply).toBe(false);
	});

	it("validates wrap-section transform shape", () => {
		const parsed = RecipeSchema.parse({
			outputPath: "dist/codex/AGENTS.md",
			blocks: ["decision-tree"],
			transforms: [{ kind: "wrap-section", title: "Too Many Cooks" }],
		});
		expect(parsed.transforms?.[0]).toEqual({ kind: "wrap-section", title: "Too Many Cooks" });
	});

	it("rejects an unknown transform kind", () => {
		expect(() =>
			RecipeSchema.parse({
				outputPath: "dist/x/y.md",
				blocks: [],
				transforms: [{ kind: "scramble" }],
			}),
		).toThrow();
	});

	it("validates extras", () => {
		const parsed = RecipeSchema.parse({
			outputPath: "dist/plugin/SKILL.md",
			blocks: ["tool-reference"],
			extras: [
				{ kind: "plugin-manifest", source: "plugin.manifest.json" },
				{ kind: "mcp-snippet", format: "json" },
			],
		});
		expect(parsed.extras).toHaveLength(2);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skill && npm test -- recipe-schema`
Expected: FAIL with `Cannot find module '../scripts/recipe-schema.js'`.

- [ ] **Step 3: Implement schema**

`skill/scripts/recipe-schema.ts`:

```ts
import { z } from "zod";

const TransformSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("wrap-section"), title: z.string() }),
	z.object({ kind: z.literal("wrap-tool-tag"), name: z.string() }),
	z.object({ kind: z.literal("strip-frontmatter") }),
]);

const ExtraSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("plugin-manifest"), source: z.string() }),
	z.object({ kind: z.literal("slash-commands"), source: z.string() }),
	z.object({
		kind: z.literal("mcp-snippet"),
		format: z.enum(["json", "jsonc", "yaml"]),
	}),
	z.object({ kind: z.literal("readme-snippet") }),
]);

export const RecipeSchema = z.object({
	outputPath: z.string().min(1),
	blocks: z.array(z.string()),
	frontmatter: z.record(z.string(), z.unknown()).optional(),
	transforms: z.array(TransformSchema).optional(),
	extras: z.array(ExtraSchema).optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type Transform = z.infer<typeof TransformSchema>;
export type Extra = z.infer<typeof ExtraSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skill && npm test -- recipe-schema`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
cd skill
git add scripts/recipe-schema.ts tests/recipe-schema.test.ts
git commit -m "feat: add zod schema for platform recipe.json"
```

---

### Task 4: Frontmatter injection helper + tests

**Files:**
- Create: `skill/scripts/frontmatter.ts`
- Create: `skill/tests/frontmatter.test.ts`

- [ ] **Step 1: Write failing test**

`skill/tests/frontmatter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { injectFrontmatter } from "../scripts/frontmatter.js";

describe("injectFrontmatter", () => {
	it("prepends YAML frontmatter to a body", () => {
		const out = injectFrontmatter("# hello", { name: "x", version: "1.0.0" });
		expect(out).toBe("---\nname: x\nversion: 1.0.0\n---\n\n# hello");
	});

	it("merges base frontmatter with platform overrides (platform wins)", () => {
		const out = injectFrontmatter("body", { description: "platform" }, { description: "base", name: "x" });
		expect(out).toContain("description: platform");
		expect(out).toContain("name: x");
	});

	it("returns body unchanged when frontmatter object is empty", () => {
		expect(injectFrontmatter("body", {})).toBe("body");
	});

	it("preserves array values", () => {
		const out = injectFrontmatter("body", { globs: [] });
		expect(out).toContain("globs: []");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skill && npm test -- frontmatter`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement frontmatter helper**

`skill/scripts/frontmatter.ts`:

```ts
import yaml from "js-yaml";

export function injectFrontmatter(
	body: string,
	frontmatter: Record<string, unknown>,
	base: Record<string, unknown> = {},
): string {
	const merged = { ...base, ...frontmatter };
	if (Object.keys(merged).length === 0) {
		return body;
	}
	const yamlStr = yaml.dump(merged, { lineWidth: -1, flowLevel: -1 }).trimEnd();
	return `---\n${yamlStr}\n---\n\n${body}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skill && npm test -- frontmatter`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
cd skill
git add scripts/frontmatter.ts tests/frontmatter.test.ts
git commit -m "feat: add frontmatter injection helper"
```

---

### Task 5: Body transforms + tests

**Files:**
- Create: `skill/scripts/transforms.ts`
- Create: `skill/tests/transforms.test.ts`

- [ ] **Step 1: Write failing test**

`skill/tests/transforms.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyTransforms } from "../scripts/transforms.js";

describe("applyTransforms", () => {
	it("wraps the body in a markdown section with the given title", () => {
		const out = applyTransforms("hello", [{ kind: "wrap-section", title: "Too Many Cooks" }]);
		expect(out).toBe("## Too Many Cooks\n\nhello");
	});

	it("wraps the body in an XML-style tool tag", () => {
		const out = applyTransforms("hello", [{ kind: "wrap-tool-tag", name: "toomanycooks" }]);
		expect(out).toBe('<tool name="toomanycooks">\nhello\n</tool>');
	});

	it("strips an existing frontmatter block", () => {
		const input = "---\nname: x\n---\n\nbody";
		const out = applyTransforms(input, [{ kind: "strip-frontmatter" }]);
		expect(out).toBe("body");
	});

	it("applies transforms in order", () => {
		const out = applyTransforms("hello", [
			{ kind: "wrap-section", title: "A" },
			{ kind: "wrap-tool-tag", name: "t" },
		]);
		expect(out).toBe('<tool name="t">\n## A\n\nhello\n</tool>');
	});

	it("returns input unchanged with no transforms", () => {
		expect(applyTransforms("x", [])).toBe("x");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skill && npm test -- transforms`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement transforms**

`skill/scripts/transforms.ts`:

```ts
import type { Transform } from "./recipe-schema.js";

export function applyTransforms(body: string, transforms: Transform[]): string {
	let result = body;
	for (const t of transforms) {
		switch (t.kind) {
			case "wrap-section":
				result = `## ${t.title}\n\n${result}`;
				break;
			case "wrap-tool-tag":
				result = `<tool name="${t.name}">\n${result}\n</tool>`;
				break;
			case "strip-frontmatter":
				result = stripFrontmatter(result);
				break;
		}
	}
	return result;
}

function stripFrontmatter(body: string): string {
	const match = body.match(/^---\n[\s\S]*?\n---\n+/);
	return match ? body.slice(match[0].length) : body;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skill && npm test -- transforms`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
cd skill
git add scripts/transforms.ts tests/transforms.test.ts
git commit -m "feat: add body transforms (wrap-section, wrap-tool-tag, strip-frontmatter)"
```

---

### Task 6: Extras module (mcp-snippet, plugin-manifest, slash-commands, readme-snippet) + tests

**Files:**
- Create: `skill/scripts/extras.ts`
- Create: `skill/tests/extras.test.ts`

- [ ] **Step 1: Write failing test**

`skill/tests/extras.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderMcpSnippet } from "../scripts/extras.js";

describe("renderMcpSnippet", () => {
	const snippet = {
		command: "npx",
		args: ["-y", "@toomanycooks/mcp-server"],
		env: { TMC_API_KEY: "tmc_live_..." },
	};

	it("formats as JSON with 2-space indent", () => {
		const out = renderMcpSnippet(snippet, "json");
		expect(out).toContain('"command": "npx"');
		expect(out).toContain('"@toomanycooks/mcp-server"');
		expect(JSON.parse(out)).toEqual(snippet);
	});

	it("formats as JSONC (same as JSON for now)", () => {
		const out = renderMcpSnippet(snippet, "jsonc");
		expect(out).toContain('"@toomanycooks/mcp-server"');
	});

	it("formats as YAML", () => {
		const out = renderMcpSnippet(snippet, "yaml");
		expect(out).toContain("command: npx");
		expect(out).toContain("TMC_API_KEY:");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skill && npm test -- extras`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement extras module**

`skill/scripts/extras.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Extra } from "./recipe-schema.js";

export interface ExtrasContext {
	platformDir: string;     // e.g. "platforms/cursor"
	canonicalDir: string;    // e.g. "canonical"
	outputDir: string;       // e.g. "dist/cursor"
	frontmatter: Record<string, unknown>;
}

export function renderMcpSnippet(
	snippet: Record<string, unknown>,
	format: "json" | "jsonc" | "yaml",
): string {
	if (format === "yaml") {
		return yaml.dump(snippet, { lineWidth: -1 }).trimEnd();
	}
	return JSON.stringify(snippet, null, 2);
}

export async function renderExtra(extra: Extra, ctx: ExtrasContext): Promise<void> {
	switch (extra.kind) {
		case "mcp-snippet": {
			const raw = await fs.readFile(path.join(ctx.canonicalDir, "mcp-snippet.json"), "utf8");
			const snippet = JSON.parse(raw) as Record<string, unknown>;
			const ext = extra.format === "yaml" ? "yml" : extra.format === "jsonc" ? "jsonc" : "json";
			const outPath = path.join(ctx.outputDir, `mcp-snippet.${ext}`);
			await fs.mkdir(path.dirname(outPath), { recursive: true });
			await fs.writeFile(outPath, renderMcpSnippet(snippet, extra.format));
			return;
		}
		case "plugin-manifest": {
			const manifestRaw = await fs.readFile(path.join(ctx.platformDir, extra.source), "utf8");
			const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
			manifest.version = ctx.frontmatter.version;
			manifest.name = manifest.name ?? ctx.frontmatter.name;
			const outPath = path.join(ctx.outputDir, ".claude-plugin/plugin.json");
			await fs.mkdir(path.dirname(outPath), { recursive: true });
			await fs.writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
			return;
		}
		case "slash-commands": {
			const sourceDir = path.join(ctx.platformDir, extra.source);
			const targetDir = path.join(ctx.outputDir, "commands");
			await fs.mkdir(targetDir, { recursive: true });
			for (const file of await fs.readdir(sourceDir)) {
				if (!file.endsWith(".md")) continue;
				const content = await fs.readFile(path.join(sourceDir, file), "utf8");
				await fs.writeFile(path.join(targetDir, file), content);
			}
			return;
		}
		case "readme-snippet": {
			// no-op for now; the per-platform README chunks are written by hand
			// in Task 19. Kept here so a recipe can declare intent.
			return;
		}
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skill && npm test -- extras`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
cd skill
git add scripts/extras.ts tests/extras.test.ts
git commit -m "feat: add extras renderer (mcp-snippet, plugin-manifest, slash-commands)"
```

---

### Task 7: Build orchestrator + integration test (no platforms yet)

**Files:**
- Create: `skill/scripts/build.ts`
- Create: `skill/tests/build.test.ts`
- Create: `skill/platforms/_test-fixture/recipe.json` (only used by the integration test, kept in `platforms/` so the same loader path works)
- Create: `skill/platforms/_test-fixture/header.md`

- [ ] **Step 1: Write failing test**

`skill/tests/build.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildPlatform } from "../scripts/build.js";

const root = path.resolve(__dirname, "..");

describe("buildPlatform", () => {
	const distDir = path.join(root, "dist", "_test-fixture");

	afterAll(async () => {
		await fs.rm(distDir, { recursive: true, force: true });
	});

	it("assembles canonical blocks with header and frontmatter for a fixture platform", async () => {
		await buildPlatform("_test-fixture", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/_test-fixture/output.md"),
			"utf8",
		);
		expect(out).toMatch(/^---\nname: toomanycooks\n/);
		expect(out).toContain("# Header for the fixture");
		expect(out).toContain("Quick decision tree");
	});
});
```

- [ ] **Step 2: Create the test fixture**

`skill/platforms/_test-fixture/recipe.json`:

```json
{
	"outputPath": "dist/_test-fixture/output.md",
	"blocks": ["decision-tree"],
	"frontmatter": { "description": "fixture for tests" }
}
```

`skill/platforms/_test-fixture/header.md`:

```markdown
# Header for the fixture
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd skill && npm test -- build`
Expected: FAIL — `buildPlatform` not exported.

- [ ] **Step 4: Implement build orchestrator**

`skill/scripts/build.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { type Recipe, RecipeSchema } from "./recipe-schema.js";
import { renderExtra } from "./extras.js";
import { injectFrontmatter } from "./frontmatter.js";
import { applyTransforms } from "./transforms.js";

export interface BuildContext {
	rootDir: string;
}

export async function buildPlatform(name: string, ctx: BuildContext): Promise<void> {
	const platformDir = path.join(ctx.rootDir, "platforms", name);
	const canonicalDir = path.join(ctx.rootDir, "canonical");

	const recipeRaw = await fs.readFile(path.join(platformDir, "recipe.json"), "utf8");
	const recipe = RecipeSchema.parse(JSON.parse(recipeRaw)) as Recipe;

	const baseFrontmatterRaw = await fs.readFile(path.join(canonicalDir, "_frontmatter.yml"), "utf8");
	const baseFrontmatter = yaml.load(baseFrontmatterRaw) as Record<string, unknown>;

	const headerPath = path.join(platformDir, "header.md");
	let header = "";
	try {
		header = await fs.readFile(headerPath, "utf8");
	} catch (_e) {
		// header.md is optional
	}

	const blocks = await Promise.all(
		recipe.blocks.map((b) => fs.readFile(path.join(canonicalDir, `${b}.md`), "utf8")),
	);

	const segments = [header, ...blocks].filter((s) => s.trim().length > 0);
	let body = segments.join("\n\n").trimEnd();

	if (recipe.transforms) {
		body = applyTransforms(body, recipe.transforms);
	}

	if (recipe.frontmatter) {
		body = injectFrontmatter(body, recipe.frontmatter, baseFrontmatter);
	}

	const outputPath = path.join(ctx.rootDir, recipe.outputPath);
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${body}\n`);

	if (recipe.extras) {
		const outputDir = path.dirname(outputPath);
		for (const extra of recipe.extras) {
			await renderExtra(extra, {
				platformDir,
				canonicalDir,
				outputDir,
				frontmatter: { ...baseFrontmatter, ...recipe.frontmatter },
			});
		}
	}
}

async function main() {
	const rootDir = path.resolve(import.meta.dirname, "..");
	const platformsDir = path.join(rootDir, "platforms");
	const entries = await fs.readdir(platformsDir, { withFileTypes: true });
	const names = entries
		.filter((e) => e.isDirectory() && !e.name.startsWith("_"))
		.map((e) => e.name);

	console.log(`Building ${names.length} platforms…`);
	for (const name of names) {
		await buildPlatform(name, { rootDir });
		console.log(`  ✓ ${name}`);
	}
}

const isEntry = import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd skill && npm test -- build`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
cd skill
git add scripts/build.ts tests/build.test.ts platforms/_test-fixture/
git commit -m "feat: build orchestrator with platform fixture integration test"
```

---

### Task 8: Platform — Claude Code skill

**Files:**
- Create: `skill/platforms/claude-code-skill/recipe.json`
- Create: `skill/platforms/claude-code-skill/header.md`
- Create: `skill/tests/snapshots/claude-code-skill.test.ts`

- [ ] **Step 1: Create recipe**

`skill/platforms/claude-code-skill/recipe.json`:

```json
{
	"outputPath": "dist/claude-code-skill/SKILL.md",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples",
		"advanced-workflows"
	],
	"frontmatter": {
		"name": "toomanycooks",
		"description": "Query crypto perpetuals funding rates and find delta-neutral arbitrage across 25 DEX exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …) via the Too Many Cooks API. Triggers on funding-rate, delta-neutral, perp/perp spread, or \"best arb right now\"-type questions."
	}
}
```

- [ ] **Step 2: Create header**

`skill/platforms/claude-code-skill/header.md`:

```markdown
# Too Many Cooks — Crypto Funding Rates Skill

Powered by the `@toomanycooks/mcp-server` MCP server. If the user hasn't installed the MCP server yet, point them at https://toomanycooks.app/dashboard/api-keys.
```

- [ ] **Step 3: Write snapshot test**

`skill/tests/snapshots/claude-code-skill.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("Claude Code skill build", () => {
	it("matches the snapshot", async () => {
		await buildPlatform("claude-code-skill", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/claude-code-skill/SKILL.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/claude-code-skill.SKILL.md");
	});
});
```

- [ ] **Step 4: Run test to bless the initial snapshot**

Run: `cd skill && npm test -- claude-code-skill`
Expected: PASS, 1 test (Vitest writes the initial snapshot file).

- [ ] **Step 5: Sanity-check the snapshot**

Run: `head -20 tests/snapshots/__snapshots__/claude-code-skill.SKILL.md`
Expected: starts with `---`, contains `name: toomanycooks`, then the header markdown, then `## Quick decision tree`.

- [ ] **Step 6: Commit**

```bash
cd skill
git add platforms/claude-code-skill/ tests/snapshots/claude-code-skill.test.ts tests/snapshots/__snapshots__/claude-code-skill.SKILL.md
git commit -m "feat: add claude-code-skill platform recipe"
```

---

### Task 9: Platform — Cursor

**Files:**
- Create: `skill/platforms/cursor/recipe.json`
- Create: `skill/platforms/cursor/header.md`
- Create: `skill/tests/snapshots/cursor.test.ts`

- [ ] **Step 1: Create recipe**

`skill/platforms/cursor/recipe.json`:

```json
{
	"outputPath": "dist/cursor/.cursor/rules/toomanycooks.mdc",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples"
	],
	"frontmatter": {
		"description": "Crypto perpetuals funding rates + delta-neutral arbitrage across 25 DEX exchanges via the Too Many Cooks MCP server.",
		"globs": [],
		"alwaysApply": false
	}
}
```

- [ ] **Step 2: Create header**

`skill/platforms/cursor/header.md`:

```markdown
# Too Many Cooks — Crypto Funding Rates

Activates when the user asks about funding rates, delta-neutral arbitrage, perp/perp spreads, or "best arb right now". Requires the `@toomanycooks/mcp-server` MCP server (see project README for setup).
```

- [ ] **Step 3: Write snapshot test**

`skill/tests/snapshots/cursor.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("Cursor build", () => {
	it("matches the snapshot", async () => {
		await buildPlatform("cursor", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/cursor/.cursor/rules/toomanycooks.mdc"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/cursor.toomanycooks.mdc");
	});
});
```

- [ ] **Step 4: Run test to bless the snapshot**

Run: `cd skill && npm test -- cursor`
Expected: PASS, 1 test.

- [ ] **Step 5: Verify the activation strategy by smoke-testing in Cursor**

Per the spec's risks section, `globs: []` + `alwaysApply: false` means the rule activates only via description-based matching. Open a Cursor project, copy the generated `.mdc` to `.cursor/rules/`, and try a prompt like *"top arbitrage opportunities right now"*. The agent should pick up the rule. If activation feels unreliable, change `alwaysApply` to `true` in the recipe and re-bless the snapshot — flag the change in the commit message.

- [ ] **Step 6: Commit**

```bash
cd skill
git add platforms/cursor/ tests/snapshots/cursor.test.ts tests/snapshots/__snapshots__/cursor.toomanycooks.mdc
git commit -m "feat: add cursor platform recipe (.mdc rule)"
```

---

### Task 10: Platform — Cline

**Files:**
- Create: `skill/platforms/cline/recipe.json`
- Create: `skill/platforms/cline/header.md`
- Create: `skill/tests/snapshots/cline.test.ts`

- [ ] **Step 1: Create recipe**

`skill/platforms/cline/recipe.json`:

```json
{
	"outputPath": "dist/cline/.clinerules/toomanycooks.md",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples"
	]
}
```

- [ ] **Step 2: Create header**

`skill/platforms/cline/header.md`:

```markdown
# Too Many Cooks — Crypto Funding Rates

Cline rule for funding-rate / delta-neutral arbitrage queries. Requires the `@toomanycooks/mcp-server` MCP server (see project README).
```

- [ ] **Step 3: Write snapshot test**

`skill/tests/snapshots/cline.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("Cline build", () => {
	it("matches the snapshot", async () => {
		await buildPlatform("cline", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/cline/.clinerules/toomanycooks.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/cline.toomanycooks.md");
	});
});
```

- [ ] **Step 4: Run test to bless the snapshot**

Run: `cd skill && npm test -- cline`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
cd skill
git add platforms/cline/ tests/snapshots/cline.test.ts tests/snapshots/__snapshots__/cline.toomanycooks.md
git commit -m "feat: add cline platform recipe"
```

---

### Task 11: Platform — Continue.dev

**Files:**
- Create: `skill/platforms/continue/recipe.json`
- Create: `skill/platforms/continue/header.md`
- Create: `skill/tests/snapshots/continue.test.ts`

- [ ] **Step 1: Create recipe**

`skill/platforms/continue/recipe.json`:

```json
{
	"outputPath": "dist/continue/.continue/rules/toomanycooks.md",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples"
	],
	"frontmatter": {
		"description": "Crypto perpetuals funding rates + delta-neutral arbitrage via the Too Many Cooks MCP server."
	}
}
```

- [ ] **Step 2: Create header**

`skill/platforms/continue/header.md`:

```markdown
# Too Many Cooks — Crypto Funding Rates

Continue.dev rule for funding-rate / delta-neutral arbitrage queries. Requires the `@toomanycooks/mcp-server` MCP server (see project README).
```

- [ ] **Step 3: Write snapshot test**

`skill/tests/snapshots/continue.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("Continue build", () => {
	it("matches the snapshot", async () => {
		await buildPlatform("continue", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/continue/.continue/rules/toomanycooks.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/continue.toomanycooks.md");
	});
});
```

- [ ] **Step 4: Run test to bless the snapshot**

Run: `cd skill && npm test -- continue`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
cd skill
git add platforms/continue/ tests/snapshots/continue.test.ts tests/snapshots/__snapshots__/continue.toomanycooks.md
git commit -m "feat: add continue.dev platform recipe"
```

---

### Task 12: Platform — Codex CLI (with section wrap + mcp-snippet extra)

**Files:**
- Create: `skill/platforms/codex/recipe.json`
- Create: `skill/platforms/codex/header.md`
- Create: `skill/tests/snapshots/codex.test.ts`

- [ ] **Step 1: Create recipe**

`skill/platforms/codex/recipe.json`:

```json
{
	"outputPath": "dist/codex/AGENTS.snippet.md",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples"
	],
	"transforms": [{ "kind": "wrap-section", "title": "Too Many Cooks" }],
	"extras": [{ "kind": "mcp-snippet", "format": "json" }]
}
```

- [ ] **Step 2: Create header (empty — section wrap supplies the title; usage instructions live in the repo README, not inside the snippet itself)**

`skill/platforms/codex/header.md`:

```markdown
Activates for funding-rate / delta-neutral arbitrage / perp-spread queries. Requires the `@toomanycooks/mcp-server` MCP server.
```

This single line *is* part of the snippet pasted into `AGENTS.md` — it tells the agent when this section applies. The "how to install" instructions are in the project README, not here.

- [ ] **Step 3: Write snapshot test**

`skill/tests/snapshots/codex.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("Codex build", () => {
	it("matches the agents-snippet snapshot", async () => {
		await buildPlatform("codex", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/codex/AGENTS.snippet.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/codex.AGENTS.snippet.md");
	});

	it("emits an mcp-snippet.json next to it", async () => {
		const out = await fs.readFile(
			path.join(root, "dist/codex/mcp-snippet.json"),
			"utf8",
		);
		expect(JSON.parse(out)).toMatchObject({ command: "npx" });
	});
});
```

- [ ] **Step 4: Run test to bless the snapshots**

Run: `cd skill && npm test -- codex`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
cd skill
git add platforms/codex/ tests/snapshots/codex.test.ts tests/snapshots/__snapshots__/codex.AGENTS.snippet.md
git commit -m "feat: add codex platform recipe (section-wrapped AGENTS.md snippet + mcp.json)"
```

---

### Task 13: Platform — Hermes (system prompt block + mcp-snippet)

**Files:**
- Create: `skill/platforms/hermes/recipe.json`
- Create: `skill/platforms/hermes/header.md`
- Create: `skill/tests/snapshots/hermes.test.ts`

- [ ] **Step 1: Create recipe**

`skill/platforms/hermes/recipe.json`:

```json
{
	"outputPath": "dist/hermes/system-prompt.md",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples"
	],
	"transforms": [{ "kind": "wrap-section", "title": "Too Many Cooks (funding rates + arb)" }],
	"extras": [{ "kind": "mcp-snippet", "format": "json" }]
}
```

- [ ] **Step 2: Create header (this single line is part of the system-prompt block; install instructions live in the repo README, not inside the prompt)**

`skill/platforms/hermes/header.md`:

```markdown
Activates for funding-rate / delta-neutral arbitrage / perp-spread queries. Requires the `@toomanycooks/mcp-server` MCP server.
```

- [ ] **Step 3: Write snapshot test**

`skill/tests/snapshots/hermes.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("Hermes build", () => {
	it("matches the system-prompt snapshot", async () => {
		await buildPlatform("hermes", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/hermes/system-prompt.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/hermes.system-prompt.md");
	});

	it("emits an mcp-snippet.json", async () => {
		const out = await fs.readFile(
			path.join(root, "dist/hermes/mcp-snippet.json"),
			"utf8",
		);
		expect(JSON.parse(out)).toMatchObject({ command: "npx" });
	});
});
```

- [ ] **Step 4: Run test to bless the snapshots**

Run: `cd skill && npm test -- hermes`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
cd skill
git add platforms/hermes/ tests/snapshots/hermes.test.ts tests/snapshots/__snapshots__/hermes.system-prompt.md
git commit -m "feat: add hermes platform recipe (system prompt block + mcp.json)"
```

---

### Task 14: Platform — Claude Code plugin (manifest + slash commands)

**Files:**
- Create: `skill/platforms/claude-code-plugin/recipe.json`
- Create: `skill/platforms/claude-code-plugin/header.md`
- Create: `skill/platforms/claude-code-plugin/plugin.manifest.json`
- Create: `skill/platforms/claude-code-plugin/commands/tmc-arb.md`
- Create: `skill/platforms/claude-code-plugin/commands/tmc-rates.md`
- Create: `skill/tests/snapshots/claude-code-plugin.test.ts`

The plugin output bundles three things: the same SKILL.md as Task 8, a `.claude-plugin/plugin.json` manifest with the MCP server config baked in, and two slash commands that act as quick-call shortcuts. The recipe nests the SKILL.md under `skills/toomanycooks/`.

- [ ] **Step 1: Create recipe**

`skill/platforms/claude-code-plugin/recipe.json`:

```json
{
	"outputPath": "dist/claude-code-plugin/skills/toomanycooks/SKILL.md",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples",
		"advanced-workflows"
	],
	"frontmatter": {
		"name": "toomanycooks",
		"description": "Query crypto perpetuals funding rates and find delta-neutral arbitrage across 25 DEX exchanges (HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX, …) via the Too Many Cooks API. Triggers on funding-rate, delta-neutral, perp/perp spread, or \"best arb right now\"-type questions."
	},
	"extras": [
		{ "kind": "plugin-manifest", "source": "plugin.manifest.json" },
		{ "kind": "slash-commands", "source": "commands" }
	]
}
```

- [ ] **Step 2: Create plugin manifest template**

`skill/platforms/claude-code-plugin/plugin.manifest.json`:

```json
{
	"name": "toomanycooks",
	"displayName": "Too Many Cooks",
	"description": "Crypto perpetuals funding rates + delta-neutral arbitrage across 25 DEX exchanges via the Too Many Cooks MCP server.",
	"author": "toomanycooks.app",
	"homepage": "https://toomanycooks.app",
	"license": "MIT",
	"mcpServers": {
		"toomanycooks": {
			"command": "npx",
			"args": ["-y", "@toomanycooks/mcp-server"],
			"env": { "TMC_API_KEY": "tmc_live_..." }
		}
	}
}
```

- [ ] **Step 3: Create slash commands**

`skill/platforms/claude-code-plugin/commands/tmc-arb.md`:

```markdown
---
description: Show the top delta-neutral arbitrage strategies right now.
---

Use the `find_arbitrage_strategies` MCP tool with `count: 5`, `minVolume24h: 1000000`, `minOpenInterest: 1000000`, `periodDays: 7`. Render a compact table (Ticker | Long → Short | Profit APR). Mention the liquidity and "rates can flip" caveats.

If the user passes arguments, treat them as a refinement: a number like `10` raises the count, an exchange list like `hyperliquid,lighter` filters via the `exchanges` arg.
```

`skill/platforms/claude-code-plugin/commands/tmc-rates.md`:

```markdown
---
description: Compare funding rates for a ticker across exchanges.
---

The user provides a ticker (e.g. `BTC`). Call `get_historical_funding` in parallel for the major exchanges (`hyperliquid`, `lighter`, `extended`, `aster`, `paradex`, `edgex`) with `tickers: ["<ticker>"]`, `periodDays: 1`. Take the latest point per exchange, sort by absolute APR descending, render a compact table.

Do NOT use `compare_exchanges_for_ticker` — it hits live exchange APIs and is slower / less reliable.
```

- [ ] **Step 4: Create header (one-line note for the SKILL.md)**

`skill/platforms/claude-code-plugin/header.md`:

```markdown
# Too Many Cooks — Crypto Funding Rates Skill

Bundled with the `@toomanycooks/mcp-server` MCP server. Configure your `TMC_API_KEY` (free tier at https://toomanycooks.app/dashboard/api-keys).
```

- [ ] **Step 5: Write snapshot test**

`skill/tests/snapshots/claude-code-plugin.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("Claude Code plugin build", () => {
	it("matches the SKILL.md snapshot", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/claude-code-plugin/skills/toomanycooks/SKILL.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/claude-code-plugin.SKILL.md");
	});

	it("emits a plugin.json manifest with the version from canonical/_frontmatter.yml", async () => {
		const raw = await fs.readFile(
			path.join(root, "dist/claude-code-plugin/skills/toomanycooks/.claude-plugin/plugin.json"),
			"utf8",
		);
		const manifest = JSON.parse(raw);
		expect(manifest.name).toBe("toomanycooks");
		expect(manifest.version).toBe("1.0.0");
		expect(manifest.mcpServers.toomanycooks.command).toBe("npx");
	});

	it("emits the slash commands", async () => {
		const dir = path.join(root, "dist/claude-code-plugin/skills/toomanycooks/commands");
		const files = await fs.readdir(dir);
		expect(files.sort()).toEqual(["tmc-arb.md", "tmc-rates.md"]);
	});
});
```

- [ ] **Step 6: Run test to bless the snapshot**

Run: `cd skill && npm test -- claude-code-plugin`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
cd skill
git add platforms/claude-code-plugin/ tests/snapshots/claude-code-plugin.test.ts tests/snapshots/__snapshots__/claude-code-plugin.SKILL.md
git commit -m "feat: add claude-code-plugin platform (manifest + slash commands)"
```

---

### Task 15: Platform — OpenClaw (best-effort)

**Files:**
- Create: `skill/platforms/openclaw/recipe.json`
- Create: `skill/platforms/openclaw/header.md`
- Create: `skill/tests/snapshots/openclaw.test.ts`

OpenClaw's AgentSkill format must be confirmed against `https://docs.openclaw.ai/` at implementation time. If the format is unclear or requires extra packaging beyond markdown + frontmatter, **defer to v1.1**: delete this task's files and remove the platform from `platforms/`. Document the deferral in `MARKETPLACES.md` (Task 20).

The recipe below is the placeholder when AgentSkills accept a markdown body with YAML frontmatter (the most common pattern). Adjust frontmatter keys after reading the OpenClaw docs.

- [ ] **Step 1: Read OpenClaw AgentSkill format docs**

Run: `curl -s https://docs.openclaw.ai/agent-skills/format | head -200`

Expected: a docs page describing the AgentSkill format. Note the required filename, location, and any frontmatter keys. If the format diverges substantially from markdown + YAML, abort this task and follow the deferral instructions above.

- [ ] **Step 2: Create recipe**

`skill/platforms/openclaw/recipe.json`:

```json
{
	"outputPath": "dist/openclaw/skills/toomanycooks/skill.md",
	"blocks": [
		"decision-tree",
		"tool-reference",
		"domain-knowledge",
		"caveats",
		"output-formatting",
		"failure-modes",
		"examples"
	],
	"frontmatter": {
		"name": "toomanycooks",
		"description": "Crypto perpetuals funding rates + delta-neutral arbitrage via the Too Many Cooks MCP server."
	},
	"extras": [{ "kind": "mcp-snippet", "format": "json" }]
}
```

If the OpenClaw docs require extra frontmatter fields (e.g. `version`, `permissions`, `triggers`), add them to the `frontmatter` object above.

- [ ] **Step 3: Create header**

`skill/platforms/openclaw/header.md`:

```markdown
# Too Many Cooks — Crypto Funding Rates

OpenClaw AgentSkill for funding-rate / delta-neutral arbitrage queries. Requires the `@toomanycooks/mcp-server` MCP server registered in your OpenClaw gateway config (see accompanying `mcp-snippet.json`).
```

- [ ] **Step 4: Write snapshot test**

`skill/tests/snapshots/openclaw.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const root = path.resolve(__dirname, "../..");

describe("OpenClaw build", () => {
	it("matches the snapshot", async () => {
		await buildPlatform("openclaw", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/openclaw/skills/toomanycooks/skill.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/openclaw.skill.md");
	});
});
```

- [ ] **Step 5: Run test to bless the snapshot**

Run: `cd skill && npm test -- openclaw`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
cd skill
git add platforms/openclaw/ tests/snapshots/openclaw.test.ts tests/snapshots/__snapshots__/openclaw.skill.md
git commit -m "feat: add openclaw platform recipe (best-effort)"
```

---

### Task 16: Build everything end-to-end

**Files:** none (smoke test of the complete pipeline)

- [ ] **Step 1: Run full build**

Run: `cd skill && rm -rf dist && npm run build`
Expected: console output `Building 8 platforms…` followed by 8 ✓ lines, no errors.

- [ ] **Step 2: Run full test suite**

Run: `cd skill && npm test`
Expected: PASS, all snapshot + unit tests pass.

- [ ] **Step 3: Lint check**

Run: `cd skill && npm run check`
Expected: PASS, no lint errors.

- [ ] **Step 4: Verify dist tree**

Run: `cd skill && find dist -type f | sort`
Expected: outputs for all 8 platforms (claude-code-skill, claude-code-plugin, cursor, cline, continue, codex, hermes, openclaw) at the paths declared in their recipes.

- [ ] **Step 5: Commit (if any auto-format ran)**

```bash
cd skill
git status
# if nothing to commit, skip; otherwise:
git add -A
git commit -m "chore: format auto-fixes from biome"
```

---

### Task 17: Mirror script

**Files:**
- Create: `skill/scripts/mirror.ts`
- Create: `skill/tests/mirror.test.ts`

Pushes `dist/<platform>/` into a separate mirror repo cloned into a temp dir, commits the diff with a deterministic message, and pushes. CI calls this once per mirrored platform.

- [ ] **Step 1: Write failing test (signature only — no real network)**

`skill/tests/mirror.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildMirrorCommitMessage } from "../scripts/mirror.js";

describe("mirror", () => {
	it("formats a deterministic commit message", () => {
		expect(
			buildMirrorCommitMessage({ sha: "abc1234", platform: "cursor" }),
		).toBe("chore: sync from monorepo @ abc1234 (cursor)");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd skill && npm test -- mirror`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement mirror script**

`skill/scripts/mirror.ts`:

```ts
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export function buildMirrorCommitMessage(args: { sha: string; platform: string }): string {
	return `chore: sync from monorepo @ ${args.sha} (${args.platform})`;
}

const MIRRORS: Record<string, string> = {
	"claude-code-plugin": "https://github.com/toomanycooks/toomanycooks-claude-plugin.git",
	cursor: "https://github.com/toomanycooks/toomanycooks-cursor.git",
};

interface MirrorOptions {
	platform: string;
	sourceDir: string;
	token: string;
}

async function mirror(opts: MirrorOptions): Promise<void> {
	const remote = MIRRORS[opts.platform];
	if (!remote) {
		throw new Error(`No mirror configured for platform "${opts.platform}"`);
	}

	const sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `tmc-mirror-${opts.platform}-`));
	const authedRemote = remote.replace("https://", `https://x-access-token:${opts.token}@`);

	try {
		execSync(`git clone --depth 1 ${authedRemote} ${tmpDir}`, { stdio: "inherit" });
		execSync(`rsync -a --delete --exclude='.git/' ${opts.sourceDir}/ ${tmpDir}/`, {
			stdio: "inherit",
		});
		execSync(`git -C ${tmpDir} add -A`, { stdio: "inherit" });

		const status = execSync(`git -C ${tmpDir} status --porcelain`, { encoding: "utf8" });
		if (status.trim().length === 0) {
			console.log(`[${opts.platform}] no changes — skipping push`);
			return;
		}

		const msg = buildMirrorCommitMessage({ sha, platform: opts.platform });
		execSync(`git -C ${tmpDir} commit -m "${msg}"`, { stdio: "inherit" });
		execSync(`git -C ${tmpDir} push origin HEAD:main`, { stdio: "inherit" });
		console.log(`[${opts.platform}] pushed`);
	} finally {
		await fs.rm(tmpDir, { recursive: true, force: true });
	}
}

async function main() {
	const platformArg = process.argv.find((a) => a.startsWith("--platform="));
	if (!platformArg) {
		throw new Error("Usage: tsx scripts/mirror.ts --platform=<name>");
	}
	const platform = platformArg.split("=")[1] ?? "";
	const token = process.env.MIRROR_PUSH_TOKEN;
	if (!token) {
		throw new Error("MIRROR_PUSH_TOKEN env var is required");
	}
	const rootDir = path.resolve(import.meta.dirname, "..");
	await mirror({
		platform,
		sourceDir: path.join(rootDir, "dist", platform),
		token,
	});
}

const isEntry = import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd skill && npm test -- mirror`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
cd skill
git add scripts/mirror.ts tests/mirror.test.ts
git commit -m "feat: add mirror script for marketplace-required dedicated repos"
```

---

### Task 18: GitHub Action — build.yml

**Files:**
- Create: `skill/.github/workflows/build.yml`

- [ ] **Step 1: Write workflow**

`skill/.github/workflows/build.yml`:

```yaml
name: build

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: .
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run build
      - name: Upload dist
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

- [ ] **Step 2: Smoke-test the action manifest locally with `act` if available, otherwise skip**

Run: `command -v act && act -j build --dry-run || echo "act not installed, skipping local validation"`
Expected: either `act` reports the workflow parses cleanly, or the message that `act` is not installed.

- [ ] **Step 3: Commit**

```bash
cd skill
git add .github/workflows/build.yml
git commit -m "ci: build + test + lint on push"
```

---

### Task 19: GitHub Action — mirror.yml

**Files:**
- Create: `skill/.github/workflows/mirror.yml`

- [ ] **Step 1: Write workflow**

`skill/.github/workflows/mirror.yml`:

```yaml
name: mirror

on:
  push:
    branches: [main]

jobs:
  mirror:
    runs-on: ubuntu-latest
    needs: []
    strategy:
      fail-fast: false
      matrix:
        platform: [claude-code-plugin, cursor]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Mirror to ${{ matrix.platform }}
        env:
          MIRROR_PUSH_TOKEN: ${{ secrets.MIRROR_PUSH_TOKEN }}
        run: |
          git config --global user.email "ci@toomanycooks.app"
          git config --global user.name "Too Many Cooks CI"
          npm run mirror -- --platform=${{ matrix.platform }}
```

- [ ] **Step 2: Add a note in the README about the required secret**

This is done in Task 20 (README rewrite). For now, just commit the workflow.

- [ ] **Step 3: Commit**

```bash
cd skill
git add .github/workflows/mirror.yml
git commit -m "ci: mirror dist to dedicated marketplace repos on push to main"
```

---

### Task 20: Rewrite README with multi-platform install instructions

**Files:**
- Modify: `skill/README.md`

The current README (1.9 KB) covers Claude Code skill install only. Replace it with a multi-platform README.

- [ ] **Step 1: Rewrite README**

`skill/README.md`:

````markdown
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
| OpenClaw | AgentSkill | ✅ (best-effort, see notes) |

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

Drop `dist/openclaw/skills/toomanycooks/skill.md` into your OpenClaw gateway's skills directory and register the MCP server using `dist/openclaw/mcp-snippet.json`.

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
````

- [ ] **Step 2: Verify the README renders cleanly**

Run: `cd skill && grep -c "## " README.md`
Expected: ≥ 6 (one per top-level section).

- [ ] **Step 3: Commit**

```bash
cd skill
git add README.md
git commit -m "docs: rewrite README with multi-platform install instructions"
```

---

### Task 21: Marketplaces submission checklist

**Files:**
- Create: `skill/MARKETPLACES.md`

- [ ] **Step 1: Write checklist**

`skill/MARKETPLACES.md`:

```markdown
# Marketplaces — submission checklist

Living checklist of where Too Many Cooks is submitted, plus what each marketplace asks for. Update when a submission lands or a new marketplace appears.

## v1 launch — submit at first stable build

### Claude Plugin Marketplace (Anthropic)

- **URL:** https://platform.claude.com/plugins/submit
- **Source repo:** https://github.com/toomanycooks/toomanycooks-claude-plugin (mirrored from `dist/claude-code-plugin/`)
- **Required:** plugin name, description, manifest URL, screenshots (≥ 2), category
- **Status:** [ ] submitted [ ] approved [ ] live
- **Notes:** Anthropic re-validates on version bump. SLA unknown — likely days-to-weeks.

### Cursor Directory

- **URL:** https://cursor.directory (community PR)
- **Source repo:** https://github.com/toomanycooks/toomanycooks-cursor (mirrored from `dist/cursor/`)
- **Required:** PR adding metadata file under `rules/` of the directory repo, pointing at `toomanycooks-cursor`
- **Status:** [ ] submitted [ ] merged [ ] live

### lobehub.com (multi-platform aggregator)

- **URL:** https://lobehub.com/skills (submission form)
- **Source repo:** main monorepo `toomanycooks-skill`
- **Required:** title, description, supported platforms (Claude / Cursor / Cline / Continue), homepage, license
- **Status:** [ ] submitted [ ] live
- **Notes:** Listing covers multiple platforms in one entry — high ROI.

## Deferred / under consideration

### skillsmp.com

Similar profile to lobehub. Submit if lobehub doesn't drive traction.

### claudemarketplaces.com

Community directory of Claude Code marketplaces. Listing happens automatically once `toomanycooks-claude-plugin` is on the official Anthropic marketplace.

### SkillsOverMCP (https://skillsovermcp.com/)

Allows hosting a GitHub repo of `SKILL.md` as an MCP server. Interesting alternate distribution but uncertain ROI — defer to v1.1.

### OpenClaw skills directory

If OpenClaw publishes a community skills directory after v1 ships, submit then.

### GPT Store

Out of scope for v1 (Family 2 — needs OpenAPI actions, not just markdown). Plan separately.
```

- [ ] **Step 2: Commit**

```bash
cd skill
git add MARKETPLACES.md
git commit -m "docs: add marketplace submission checklist"
```

---

### Task 22: Replace legacy SKILL.md with the generated output

**Files:**
- Delete: `skill/SKILL.md`
- Modify: `skill/README.md` (already updated in Task 20 — no further change here)

The legacy `SKILL.md` at the repo root has served as the source of truth so far. With the build pipeline producing `dist/claude-code-skill/SKILL.md`, the legacy file is now redundant and risks drift. Removing it makes `dist/` the canonical artifact.

- [ ] **Step 1: Confirm dist version is byte-equivalent in spirit**

Run: `cd skill && diff <(sed -n '/^# Too Many Cooks/,$p' SKILL.md) <(sed -n '/^# Too Many Cooks/,$p' dist/claude-code-skill/SKILL.md) | head -40`
Expected: only minor cosmetic differences (formatting, link path adjustments). No content drift on substantive blocks.

If there is substantive drift (a paragraph missing in `dist/`), pause and reconcile by editing the relevant `canonical/*.md` block before continuing.

- [ ] **Step 2: Delete legacy SKILL.md**

Run: `cd skill && git rm SKILL.md`
Expected: file removed and staged.

- [ ] **Step 3: Re-run full pipeline as a final smoke test**

Run: `cd skill && rm -rf dist && npm ci && npm run check && npm test && npm run build`
Expected: all green, 8 platforms built.

- [ ] **Step 4: Commit**

```bash
cd skill
git commit -m "chore: remove legacy SKILL.md (now generated under dist/claude-code-skill/)"
```

---

### Task 23: Tag v1.0.0 and push

**Files:** none (release ceremony)

- [ ] **Step 1: Tag the release**

Run: `cd skill && git tag -a v1.0.0 -m "v1.0.0 — multi-platform skills (Claude skill+plugin, Cursor, Cline, Continue, Codex, Hermes, OpenClaw)"`

- [ ] **Step 2: Push commits and tag**

Run: `cd skill && git push origin main --follow-tags`
Expected: push succeeds, CI build + mirror workflows trigger.

- [ ] **Step 3: Verify CI**

Run: `cd skill && gh run list --limit 5`
Expected: latest runs of `build` and `mirror` are queued or running.

- [ ] **Step 4: Once CI is green, verify mirror repos**

Run: `gh repo view toomanycooks/toomanycooks-claude-plugin` and `gh repo view toomanycooks/toomanycooks-cursor`
Expected: each repo shows a recent commit `chore: sync from monorepo @ <sha> (<platform>)`.

If a mirror repo doesn't exist yet, create it from the GitHub UI as a public empty repo (no README, no license — the mirror push provides everything), then re-trigger the workflow.

- [ ] **Step 5: Submit to marketplaces**

Open `MARKETPLACES.md`, walk down the v1-launch list, submit each one. Tick the boxes as you go.

---

## Spec coverage check (filled by author at plan creation)

- ✅ Goal & non-goals — covered by intro + Task 0 (none, but spec referenced).
- ✅ Repo layout — Tasks 1, 2, 7, 8–15.
- ✅ Source-of-truth strategy β — Task 2 (canonical extraction) + Tasks 7–15 (recipes consume blocks).
- ✅ Build script — Tasks 3–7.
- ✅ npm scripts (`build`, `test`, `check`, `mirror`) — Task 1.
- ✅ Tests (snapshot per platform) — one test per platform task (8–15).
- ✅ Distribution (D2-light, mirror to ≤2 repos) — Task 17 (script) + Task 19 (workflow).
- ✅ Marketplace submissions checklist — Task 21.
- ✅ Versioning (single source in `_frontmatter.yml`) — Task 2 + Task 6 (manifest version injected).
- ✅ Naming consistency — covered across recipes; reinforced in README (Task 20).
- ✅ Risks (OpenClaw fallback, Cursor frontmatter, Marketplace SLA, PAT rotation) — Tasks 15 (OpenClaw deferral), 9 (Cursor frontmatter set), 21 (SLA noted), 19 + 20 (PAT documented).
- ✅ Out-of-scope items — none implemented.

## Notes for the executor

- All snapshot tests are blessed by Vitest the first time they run. Re-blessing requires `npm test -- -u`. Treat any snapshot diff as a deliberate decision and review the diff carefully before re-blessing.
- The Claude Code legacy `SKILL.md` lives at `skill/SKILL.md` until Task 22. Don't touch it in earlier tasks — keep the canonical extraction (Task 2) byte-equivalent in spirit, and only delete the legacy file once `dist/claude-code-skill/SKILL.md` clearly supersedes it.
- The fixture platform `_test-fixture/` (Task 7) stays in the repo as a lightweight integration test surface. It is excluded from the `build` runner by the `_` prefix filter.
