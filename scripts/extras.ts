import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Extra } from "./recipe-schema.js";

export interface ExtrasContext {
	platformDir: string; // e.g. "platforms/cursor"
	canonicalDir: string; // e.g. "canonical"
	outputDir: string; // e.g. "dist/cursor"
	/** Resolved base frontmatter (name, version, …) used to stamp manifests. */
	frontmatter: Record<string, unknown>;
}

export function renderMcpSnippet(
	snippet: Record<string, unknown>,
	format: "json" | "jsonc" | "yaml",
): string {
	if (format === "yaml") {
		return yaml.dump(snippet, { lineWidth: -1 }).trimEnd();
	}
	return JSON.stringify(snippet, null, 2);
}

export async function renderExtra(extra: Extra, ctx: ExtrasContext): Promise<void> {
	switch (extra.kind) {
		case "mcp-snippet": {
			const raw = await fs.readFile(path.join(ctx.canonicalDir, "mcp-snippet.json"), "utf8");
			const snippet = JSON.parse(raw) as Record<string, unknown>;
			const ext = extra.format === "yaml" ? "yml" : extra.format === "jsonc" ? "jsonc" : "json";
			const outPath = path.join(ctx.outputDir, `mcp-snippet.${ext}`);
			await fs.mkdir(path.dirname(outPath), { recursive: true });
			await fs.writeFile(outPath, `${renderMcpSnippet(snippet, extra.format)}\n`);
			return;
		}
		case "plugin-manifest": {
			const manifestRaw = await fs.readFile(path.join(ctx.platformDir, extra.source), "utf8");
			const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
			manifest.version = ctx.frontmatter.version;
			manifest.name = manifest.name ?? ctx.frontmatter.name;
			const outPath = path.join(ctx.outputDir, ".claude-plugin/plugin.json");
			await fs.mkdir(path.dirname(outPath), { recursive: true });
			await fs.writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
			return;
		}
		case "marketplace": {
			const raw = await fs.readFile(path.join(ctx.platformDir, extra.source), "utf8");
			// Stamp the current version into every `"version": "$version"` placeholder.
			const stamped = raw.replaceAll('"$version"', JSON.stringify(ctx.frontmatter.version));
			const catalog = JSON.parse(stamped) as Record<string, unknown>;
			const outPath = path.join(ctx.outputDir, ".claude-plugin/marketplace.json");
			await fs.mkdir(path.dirname(outPath), { recursive: true });
			await fs.writeFile(outPath, `${JSON.stringify(catalog, null, 2)}\n`);
			return;
		}
		case "slash-commands": {
			const sourceDir = path.join(ctx.platformDir, extra.source);
			const targetDir = path.join(ctx.outputDir, "commands");
			await fs.mkdir(targetDir, { recursive: true });
			for (const file of (await fs.readdir(sourceDir)).sort()) {
				if (!file.endsWith(".md")) continue;
				const content = await fs.readFile(path.join(sourceDir, file), "utf8");
				await fs.writeFile(path.join(targetDir, file), content);
			}
			return;
		}
		case "readme-snippet": {
			// no-op: per-platform README chunks live in the repo README, not in dist/.
			return;
		}
	}
}
