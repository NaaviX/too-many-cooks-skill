import { describe, expect, it } from "vitest";
import { injectFrontmatter } from "../scripts/frontmatter.js";

describe("injectFrontmatter", () => {
	it("prepends YAML frontmatter to a body", () => {
		const out = injectFrontmatter("# hello", { name: "x", version: "1.0.0" });
		expect(out).toBe("---\nname: x\nversion: 1.0.0\n---\n\n# hello");
	});

	it("merges base frontmatter with platform overrides (platform wins)", () => {
		const out = injectFrontmatter(
			"body",
			{ description: "platform" },
			{ description: "base", name: "x" },
		);
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
