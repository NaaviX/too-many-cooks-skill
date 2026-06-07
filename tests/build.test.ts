import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../scripts/build.js";

const root = path.resolve(__dirname, "..");

/** Primary generated artifact per platform — the file we snapshot. */
const PLATFORM_OUTPUTS: Record<string, string> = {
	"claude-code-skill": "dist/claude-code-skill/SKILL.md",
	"claude-code-plugin": "dist/claude-code-plugin/skills/toomanycooks/SKILL.md",
	cursor: "dist/cursor/.cursor/rules/toomanycooks.mdc",
	cline: "dist/cline/.clinerules/toomanycooks.md",
	continue: "dist/continue/.continue/rules/toomanycooks.md",
	codex: "dist/codex/AGENTS.snippet.md",
	hermes: "dist/hermes/system-prompt.md",
	openclaw: "dist/openclaw/skills/toomanycooks/SKILL.md",
};

describe("multi-platform build", () => {
	for (const [platform, outputPath] of Object.entries(PLATFORM_OUTPUTS)) {
		it(`${platform} matches its snapshot`, async () => {
			await buildPlatform(platform, { rootDir: root });
			const out = await fs.readFile(path.join(root, outputPath), "utf8");
			await expect(out).toMatchFileSnapshot(`snapshots/${platform}.snap.md`);
		});
	}

	it("claude-code-plugin stamps the manifest version from canonical/_frontmatter.yml", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const raw = await fs.readFile(
			path.join(root, "dist/claude-code-plugin/skills/toomanycooks/.claude-plugin/plugin.json"),
			"utf8",
		);
		const manifest = JSON.parse(raw);
		expect(manifest.name).toBe("toomanycooks");
		expect(manifest.version).toBe("1.1.0");
		expect(manifest.mcpServers.toomanycooks.command).toBe("npx");
	});

	it("claude-code-plugin emits both slash commands", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const dir = path.join(root, "dist/claude-code-plugin/skills/toomanycooks/commands");
		const files = (await fs.readdir(dir)).sort();
		expect(files).toEqual(["tmc-arb.md", "tmc-rates.md"]);
	});

	it("codex and hermes each emit a runnable mcp-snippet.json", async () => {
		for (const platform of ["codex", "hermes"]) {
			await buildPlatform(platform, { rootDir: root });
			const raw = await fs.readFile(path.join(root, `dist/${platform}/mcp-snippet.json`), "utf8");
			expect(JSON.parse(raw)).toMatchObject({ command: "npx" });
		}
	});

	it("openclaw resolves the $version placeholder", async () => {
		await buildPlatform("openclaw", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/openclaw/skills/toomanycooks/SKILL.md"),
			"utf8",
		);
		expect(out).toContain("version: 1.1.0");
		expect(out).not.toContain("$version");
	});
});
