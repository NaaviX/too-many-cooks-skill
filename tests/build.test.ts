import { createHash } from "node:crypto";
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
	"codex-plugin": "dist/codex-plugin/skills/toomanycooks/SKILL.md",
	hermes: "dist/hermes/system-prompt.md",
	openclaw: "dist/openclaw/skills/toomanycooks/SKILL.md",
	windsurf: "dist/windsurf/.windsurf/rules/toomanycooks.md",
	copilot: "dist/copilot/.github/copilot-instructions.md",
	gemini: "dist/gemini/GEMINI.md",
	roo: "dist/roo/.roo/rules/toomanycooks.md",
	zed: "dist/zed/.rules",
	junie: "dist/junie/.junie/guidelines.md",
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

	it("codex-plugin emits a Codex manifest, MCP config, and skill at the plugin root", async () => {
		await buildPlatform("codex-plugin", { rootDir: root });
		const pluginRoot = path.join(root, "dist/codex-plugin");
		await expect(
			fs.access(path.join(pluginRoot, ".codex-plugin/plugin.json")),
		).resolves.toBeUndefined();
		await expect(fs.access(path.join(pluginRoot, ".mcp.json"))).resolves.toBeUndefined();
		await expect(
			fs.access(path.join(pluginRoot, "skills/toomanycooks/SKILL.md")),
		).resolves.toBeUndefined();
		await expect(
			fs.access(path.join(pluginRoot, "skills/toomanycooks/.codex-plugin")),
		).rejects.toThrow();

		const manifest = JSON.parse(
			await fs.readFile(path.join(pluginRoot, ".codex-plugin/plugin.json"), "utf8"),
		);
		expect(manifest.name).toBe("toomanycooks");
		expect(manifest.version).toBe("1.2.0");
		expect(manifest.skills).toBe("./skills/");
		expect(manifest.mcpServers).toBe("./.mcp.json");
		expect(manifest.interface.capabilities).toContain("Data");

		const mcp = JSON.parse(await fs.readFile(path.join(pluginRoot, ".mcp.json"), "utf8"));
		expect(mcp.mcpServers.toomanycooks.command).toBe("npx");
		expect(mcp.mcpServers.toomanycooks.env.TMC_API_KEY).toBe("${TMC_API_KEY}");
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

	it("hermes emits an installable skill and well-known discovery indexes", async () => {
		await buildPlatform("hermes", { rootDir: root });
		const skillPath = path.join(root, "dist/hermes/skills/toomanycooks/SKILL.md");
		const wellKnownSkillPath = path.join(
			root,
			"dist/hermes/.well-known/agent-skills/toomanycooks/SKILL.md",
		);
		const skill = await fs.readFile(skillPath, "utf8");
		const wellKnownSkill = await fs.readFile(wellKnownSkillPath);
		expect(skill).toContain("name: toomanycooks");
		expect(skill).toContain("version: 1.2.0");
		expect(skill).toContain("required_environment_variables:");
		expect(skill).toContain("name: TMC_API_KEY");
		expect(skill).toContain("tags:");
		expect(skill).toContain("## Too Many Cooks (funding rates + arb)");
		expect(wellKnownSkill.toString()).toBe(skill);

		const index = JSON.parse(
			await fs.readFile(path.join(root, "dist/hermes/.well-known/agent-skills/index.json"), "utf8"),
		);
		const expectedDigest = `sha256:${createHash("sha256").update(wellKnownSkill).digest("hex")}`;
		expect(index.$schema).toBe("https://schemas.agentskills.io/discovery/0.2.0/schema.json");
		expect(index.skills[0]).toMatchObject({
			name: "toomanycooks",
			type: "skill-md",
			url: "/.well-known/agent-skills/toomanycooks/SKILL.md",
			digest: expectedDigest,
		});

		const legacy = JSON.parse(
			await fs.readFile(path.join(root, "dist/hermes/.well-known/skills/index.json"), "utf8"),
		);
		expect(legacy.skills[0].name).toBe("toomanycooks");
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
