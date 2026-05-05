import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { renderExtra } from "./extras.js";
import { injectFrontmatter } from "./frontmatter.js";
import { type Recipe, RecipeSchema } from "./recipe-schema.js";
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
