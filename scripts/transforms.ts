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
