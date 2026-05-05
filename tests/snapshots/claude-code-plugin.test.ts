import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

describe("Claude Code plugin build", () => {
	it("matches the SKILL.md snapshot", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/claude-code-plugin/skills/toomanycooks/SKILL.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/claude-code-plugin.SKILL.md");
	});

	it("emits a plugin.json manifest with the version from canonical/_frontmatter.yml", async () => {
		const raw = await fs.readFile(
			path.join(root, "dist/claude-code-plugin/skills/toomanycooks/.claude-plugin/plugin.json"),
			"utf8",
		);
		const manifest = JSON.parse(raw);
		expect(manifest.name).toBe("toomanycooks");
		expect(manifest.version).toBe("1.0.0");
		expect(manifest.mcpServers.toomanycooks.command).toBe("npx");
	});

	it("emits the slash commands", async () => {
		const dir = path.join(root, "dist/claude-code-plugin/skills/toomanycooks/commands");
		const files = await fs.readdir(dir);
		expect(files.sort()).toEqual(["tmc-arb.md", "tmc-rates.md"]);
	});
});
