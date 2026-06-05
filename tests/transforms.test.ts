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

	it("returns the input unchanged with no transforms", () => {
		expect(applyTransforms("x", [])).toBe("x");
	});
});
