import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Hand-maintained files that display the skill version. `npm run build` rewrites
 * them from `canonical/_frontmatter.yml` so a version bump can never drift.
 */
const STAMP_TARGETS: Array<{
	file: string;
	pattern: RegExp;
	replacement: (version: string) => string;
}> = [
	{
		file: "README.md",
		pattern: /badge\/version-\d+\.\d+\.\d+-/g,
		replacement: (version) => `badge/version-${version}-`,
	},
	{
		file: "docs.html",
		pattern: /\bv\d+\.\d+\.\d+\b/g,
		replacement: (version) => `v${version}`,
	},
];

/** Rewrite the version strings in every stamp target. Returns the touched files. */
export async function stampVersion(rootDir: string, version: string): Promise<string[]> {
	const touched: string[] = [];
	for (const target of STAMP_TARGETS) {
		const filePath = path.join(rootDir, target.file);
		const before = await fs.readFile(filePath, "utf8");
		const after = before.replace(target.pattern, target.replacement(version));
		if (after !== before) {
			await fs.writeFile(filePath, after);
			touched.push(target.file);
		}
	}
	return touched;
}
