import { existsSync, readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { RecipeSchema } from "../scripts/recipe-schema.js";

const root = path.resolve(__dirname, "..");
const canonicalDir = path.join(root, "canonical");
const platformsDir = path.join(root, "platforms");

const { version } = yaml.load(
	readFileSync(path.join(canonicalDir, "_frontmatter.yml"), "utf8"),
) as { version: string };

const platforms = readdirSync(platformsDir, { withFileTypes: true })
	.filter((e) => e.isDirectory() && !e.name.startsWith("_"))
	.map((e) => e.name);

/**
 * Content lint: a recipe referencing a non-existent canonical block (or an extras
 * source that isn't there) only fails at build time with a raw ENOENT, and a
 * renamed block can silently drop content from a downstream platform. These
 * assertions turn that into an upfront, named failure.
 */
describe("recipe integrity", () => {
	for (const platform of platforms) {
		const recipe = RecipeSchema.parse(
			JSON.parse(readFileSync(path.join(platformsDir, platform, "recipe.json"), "utf8")),
		);

		it(`${platform}: every referenced canonical block exists`, () => {
			const blocks = new Set<string>(recipe.blocks);
			for (const ref of recipe.bundledReferences ?? []) {
				for (const b of ref.blocks) blocks.add(b);
			}
			for (const block of blocks) {
				expect(
					existsSync(path.join(canonicalDir, `${block}.md`)),
					`canonical/${block}.md (referenced by platforms/${platform}/recipe.json) is missing`,
				).toBe(true);
			}
		});

		it(`${platform}: every extras source exists`, () => {
			for (const extra of recipe.extras ?? []) {
				if (!("source" in extra) || typeof extra.source !== "string") continue;
				// agent-skills-index reads its source from the build output, not the
				// platform dir, so skip it here.
				if (extra.kind === "agent-skills-index") continue;
				expect(
					existsSync(path.join(platformsDir, platform, extra.source)),
					`platforms/${platform}/${extra.source} (extras source) is missing`,
				).toBe(true);
			}
		});
	}
});

describe("changelog", () => {
	it("has an entry for the current canonical version", () => {
		const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
		expect(
			changelog.includes(`## [${version}]`),
			`CHANGELOG.md is missing a "## [${version}]" entry — add it in the same commit as the version bump`,
		).toBe(true);
	});
});
