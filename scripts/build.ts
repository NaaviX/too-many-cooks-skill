import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { renderExtra } from "./extras.js";
import { injectFrontmatter } from "./frontmatter.js";
import { type Recipe, RecipeSchema } from "./recipe-schema.js";
import { stampVersion } from "./stamp-version.js";
import { applyTransforms } from "./transforms.js";

export interface BuildContext {
	rootDir: string;
}

/** Replace the literal string `$version` anywhere in a frontmatter object. */
function substituteVersion(
	frontmatter: Record<string, unknown>,
	version: unknown,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(frontmatter)) {
		out[key] = value === "$version" ? version : value;
	}
	return out;
}

function renderBody(
	baseBody: string,
	options: {
		frontmatter?: Record<string, unknown>;
		transforms?: Recipe["transforms"];
	},
	version: unknown,
): string {
	let body = baseBody;
	if (options.transforms) {
		body = applyTransforms(body, options.transforms);
	}
	if (options.frontmatter) {
		const resolved = substituteVersion(options.frontmatter, version);
		body = injectFrontmatter(body, resolved);
	}
	return body;
}

export async function buildPlatform(name: string, ctx: BuildContext): Promise<void> {
	const platformDir = path.join(ctx.rootDir, "platforms", name);
	const canonicalDir = path.join(ctx.rootDir, "canonical");

	const recipeRaw = await fs.readFile(path.join(platformDir, "recipe.json"), "utf8");
	const recipe = RecipeSchema.parse(JSON.parse(recipeRaw)) as Recipe;

	const baseFrontmatterRaw = await fs.readFile(path.join(canonicalDir, "_frontmatter.yml"), "utf8");
	const baseFrontmatter = yaml.load(baseFrontmatterRaw) as Record<string, unknown>;

	let header = "";
	try {
		header = await fs.readFile(path.join(platformDir, "header.md"), "utf8");
	} catch {
		// header.md is optional
	}

	/** Read the named canonical blocks and join them like the primary body. */
	async function assembleBlocks(blockNames: string[], lead = ""): Promise<string> {
		const loaded = await Promise.all(
			blockNames.map((b) => fs.readFile(path.join(canonicalDir, `${b}.md`), "utf8")),
		);
		return [lead, ...loaded]
			.map((s) => s.trim())
			.filter((s) => s.length > 0)
			.join("\n\n");
	}

	const baseBody = await assembleBlocks(recipe.blocks, header);
	const body = renderBody(baseBody, recipe, baseFrontmatter.version);

	const outputPath = path.join(ctx.rootDir, recipe.outputPath);
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${body}\n`);

	if (recipe.bundledReferences) {
		for (const reference of recipe.bundledReferences) {
			const referenceBody = await assembleBlocks(reference.blocks);
			const referencePath = path.join(ctx.rootDir, reference.outputPath);
			await fs.mkdir(path.dirname(referencePath), { recursive: true });
			await fs.writeFile(referencePath, `${referenceBody}\n`);
		}
	}

	if (recipe.additionalOutputs) {
		for (const output of recipe.additionalOutputs) {
			const additionalBody = renderBody(baseBody, output, baseFrontmatter.version);
			const additionalPath = path.join(ctx.rootDir, output.outputPath);
			await fs.mkdir(path.dirname(additionalPath), { recursive: true });
			await fs.writeFile(additionalPath, `${additionalBody}\n`);
		}
	}

	if (recipe.extras) {
		const outputDir = recipe.extrasDir
			? path.join(ctx.rootDir, recipe.extrasDir)
			: path.dirname(outputPath);
		for (const extra of recipe.extras) {
			await renderExtra(extra, {
				platformDir,
				canonicalDir,
				outputDir,
				frontmatter: baseFrontmatter,
			});
		}
	}
}

async function main(): Promise<void> {
	const rootDir = path.resolve(import.meta.dirname, "..");
	const platformsDir = path.join(rootDir, "platforms");
	const entries = await fs.readdir(platformsDir, { withFileTypes: true });
	const names = entries
		.filter((e) => e.isDirectory() && !e.name.startsWith("_"))
		.map((e) => e.name)
		.sort();

	console.log(`Building ${names.length} platforms…`);
	for (const name of names) {
		await buildPlatform(name, { rootDir });
		console.log(`  ✓ ${name}`);
	}

	const frontmatterRaw = await fs.readFile(
		path.join(rootDir, "canonical", "_frontmatter.yml"),
		"utf8",
	);
	const { version } = yaml.load(frontmatterRaw) as { version: string };
	const stamped = await stampVersion(rootDir, version);
	for (const file of stamped) {
		console.log(`  ✓ stamped v${version} into ${file}`);
	}
}

const isEntry = import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
