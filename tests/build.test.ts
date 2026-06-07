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

	it("claude-code-plugin puts the manifest, marketplace, and commands at the plugin root", async () => {
		// Layout matters: Claude Code only loads commands/ and the MCP server from
		// plugin.json when they sit at the plugin *root*, not nested under skills/.
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const pluginRoot = path.join(root, "dist/claude-code-plugin");
		await expect(
			fs.access(path.join(pluginRoot, ".claude-plugin/plugin.json")),
		).resolves.toBeUndefined();
		await expect(
			fs.access(path.join(pluginRoot, ".claude-plugin/marketplace.json")),
		).resolves.toBeUndefined();
		await expect(fs.access(path.join(pluginRoot, "commands"))).resolves.toBeUndefined();
		await expect(
			fs.access(path.join(pluginRoot, "skills/toomanycooks/SKILL.md")),
		).resolves.toBeUndefined();
		// Nothing should leak into the skill directory.
		await expect(
			fs.access(path.join(pluginRoot, "skills/toomanycooks/.claude-plugin")),
		).rejects.toThrow();
	});

	it("claude-code-plugin stamps the manifest version and wires the API key via userConfig", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const raw = await fs.readFile(
			path.join(root, "dist/claude-code-plugin/.claude-plugin/plugin.json"),
			"utf8",
		);
		const manifest = JSON.parse(raw);
		expect(manifest.name).toBe("toomanycooks");
		expect(manifest.version).toBe("1.2.0");
		expect(manifest.mcpServers.toomanycooks.command).toBe("npx");
		// A shared plugin must prompt for the key, not ship a baked placeholder.
		expect(manifest.userConfig.api_key.sensitive).toBe(true);
		expect(manifest.mcpServers.toomanycooks.env.TMC_API_KEY).toBe("${user_config.api_key}");
	});

	it("claude-code-plugin marketplace catalog lists the plugin at the repo root", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const raw = await fs.readFile(
			path.join(root, "dist/claude-code-plugin/.claude-plugin/marketplace.json"),
			"utf8",
		);
		const catalog = JSON.parse(raw);
		expect(catalog.plugins).toHaveLength(1);
		expect(catalog.plugins[0]).toMatchObject({
			name: "toomanycooks",
			source: ".",
			version: "1.2.0",
		});
	});

	it("claude-code-plugin emits all slash commands", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const dir = path.join(root, "dist/claude-code-plugin/commands");
		const files = (await fs.readdir(dir)).sort();
		expect(files).toEqual(["tmc-arb.md", "tmc-rates.md", "tmc-setup.md"]);
	});

	it("every MCP-wired platform emits a runnable mcp-snippet.json", async () => {
		for (const platform of ["codex", "hermes", "openclaw", "cursor", "cline", "continue"]) {
			await buildPlatform(platform, { rootDir: root });
			const dir =
				platform === "openclaw" ? "dist/openclaw/skills/toomanycooks" : `dist/${platform}`;
			const raw = await fs.readFile(path.join(root, `${dir}/mcp-snippet.json`), "utf8");
			expect(JSON.parse(raw)).toMatchObject({ command: "npx" });
		}
	});

	it("openclaw resolves the $version placeholder", async () => {
		await buildPlatform("openclaw", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/openclaw/skills/toomanycooks/SKILL.md"),
			"utf8",
		);
		expect(out).toContain("version: 1.2.0");
		expect(out).not.toContain("$version");
	});
});
