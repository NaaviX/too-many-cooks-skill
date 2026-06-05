import yaml from "js-yaml";

/**
 * Prepend a YAML frontmatter block to a markdown body.
 *
 * Each platform recipe declares the *exact* frontmatter it wants — there is no
 * implicit merge of a shared base, so a strict consumer (e.g. Cursor `.mdc`)
 * never inherits keys it doesn't understand. The single shared value, the
 * `version`, reaches a recipe via the `$version` placeholder, substituted in
 * `build.ts` before this function runs.
 */
export function injectFrontmatter(body: string, frontmatter: Record<string, unknown>): string {
	if (Object.keys(frontmatter).length === 0) {
		return body;
	}
	const yamlStr = yaml.dump(frontmatter, { lineWidth: -1, flowLevel: -1 }).trimEnd();
	return `---\n${yamlStr}\n---\n\n${body}`;
}
