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
