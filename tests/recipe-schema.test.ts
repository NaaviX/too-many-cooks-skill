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

	it("validates the wrap-section transform shape", () => {
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
			additionalOutputs: [
				{
					outputPath: "dist/plugin/.well-known/agent-skills/foo/SKILL.md",
					frontmatter: { name: "foo", version: "$version" },
					transforms: [{ kind: "wrap-section", title: "Foo" }],
				},
			],
			extras: [
				{ kind: "plugin-manifest", source: "plugin.manifest.json" },
				{ kind: "mcp-snippet", format: "json" },
				{
					kind: "agent-skills-index",
					source: ".well-known/agent-skills/foo/SKILL.md",
					name: "foo",
					description: "Foo skill.",
					url: "/.well-known/agent-skills/foo/SKILL.md",
				},
			],
		});
		expect(parsed.additionalOutputs).toHaveLength(1);
		expect(parsed.extras).toHaveLength(3);
	});
});
