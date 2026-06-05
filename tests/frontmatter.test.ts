import { describe, expect, it } from "vitest";
import { injectFrontmatter } from "../scripts/frontmatter.js";

describe("injectFrontmatter", () => {
	it("prepends YAML frontmatter to a body", () => {
		const out = injectFrontmatter("# hello", { name: "x", version: "1.0.0" });
		expect(out).toBe("---\nname: x\nversion: 1.0.0\n---\n\n# hello");
	});

	it("returns the body unchanged when frontmatter is empty", () => {
		expect(injectFrontmatter("body", {})).toBe("body");
	});

	it("preserves empty array values", () => {
		const out = injectFrontmatter("body", { globs: [] });
		expect(out).toContain("globs: []");
	});

	it("only emits the keys it is given (no implicit base merge)", () => {
		const out = injectFrontmatter("body", { description: "only me" });
		expect(out).toContain("description: only me");
		expect(out).not.toContain("name:");
		expect(out).not.toContain("license:");
	});
});
