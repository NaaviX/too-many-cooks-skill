import { createHash } from "node:crypto";
import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../scripts/build.js";
import { stampVersion } from "../scripts/stamp-version.js";

const root = path.resolve(__dirname, "..");

/** Single source of the version — tests must never hardcode it. */
const { version } = yaml.load(
	readFileSync(path.join(root, "canonical/_frontmatter.yml"), "utf8"),
) as { version: string };

/** Primary generated artifact per platform — the file we snapshot. */
const PLATFORM_OUTPUTS: Record<string, string> = {
	"agent-skills": "skills/toomanycooks/SKILL.md",
	"claude-code-plugin": "dist/claude-code-plugin/skills/toomanycooks/SKILL.md",
	"codex-plugin": "dist/codex-plugin/skills/toomanycooks/SKILL.md",
	cursor: "dist/cursor/.cursor/rules/toomanycooks.mdc",
	copilot: "dist/copilot/.github/copilot-instructions.md",
	hermes: "dist/hermes/system-prompt.md",
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
		expect(manifest.version).toBe(version);
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
			version,
		});
	});

	it("claude-code-plugin emits all slash commands", async () => {
		await buildPlatform("claude-code-plugin", { rootDir: root });
		const dir = path.join(root, "dist/claude-code-plugin/commands");
		const files = (await fs.readdir(dir)).sort();
		expect(files).toEqual([
			"toomanycooks-doctor.md",
			"toomanycooks-help.md",
			"toomanycooks-setup.md",
		]);
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
		expect(manifest.version).toBe(version);
		expect(manifest.skills).toBe("./skills/");
		expect(manifest.mcpServers).toBe("./.mcp.json");
		expect(manifest.interface.capabilities).toContain("Data");

		const mcp = JSON.parse(await fs.readFile(path.join(pluginRoot, ".mcp.json"), "utf8"));
		expect(mcp.mcpServers.toomanycooks.command).toBe("npx");
		expect(mcp.mcpServers.toomanycooks.env.TMC_API_KEY).toBe("${TMC_API_KEY}");
	});

	it("agent-skills splits deep reference into on-demand bundled files", async () => {
		await buildPlatform("agent-skills", { rootDir: root });
		const refDir = "skills/toomanycooks/reference";
		for (const name of [
			"tool-reference",
			"personalization",
			"advanced-workflows",
			"mcp-troubleshooting",
		]) {
			const out = await fs.readFile(path.join(root, refDir, `${name}.md`), "utf8");
			await expect(out).toMatchFileSnapshot(`snapshots/agent-skills-reference-${name}.snap.md`);
		}
		// The deep reference must NOT remain inline in the lean core SKILL.md.
		const core = await fs.readFile(path.join(root, "skills/toomanycooks/SKILL.md"), "utf8");
		expect(core).not.toContain("Useful args");
		expect(core).toContain("Reference files (load on demand)");
	});

	it("each plugin bundles the same reference/ tree next to its SKILL.md", async () => {
		for (const platform of ["claude-code-plugin", "codex-plugin"]) {
			await buildPlatform(platform, { rootDir: root });
			await expect(
				fs.access(
					path.join(root, `dist/${platform}/skills/toomanycooks/reference/tool-reference.md`),
				),
			).resolves.toBeUndefined();
		}
	});

	it("every MCP-wired platform emits a runnable mcp-snippet.json", async () => {
		for (const platform of ["hermes", "cursor", "copilot", "agent-skills"]) {
			await buildPlatform(platform, { rootDir: root });
			// agent-skills ships its snippet at the repo root (the mirror-less,
			// `npx skills add`-served tree); the rest nest it under dist/<platform>.
			const dir = platform === "agent-skills" ? "." : `dist/${platform}`;
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
		expect(skill).toContain(`version: ${version}`);
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

	it("README and docs.html carry the canonical version (stamped by the build)", async () => {
		// stampVersion is idempotent: on a clean tree this rewrites nothing and the
		// committed copies must already display the _frontmatter.yml version.
		await stampVersion(root, version);
		const readme = await fs.readFile(path.join(root, "README.md"), "utf8");
		const docs = await fs.readFile(path.join(root, "docs.html"), "utf8");
		expect(readme).toContain(`badge/version-${version}-`);
		expect(docs).toContain(`v${version}`);
		expect(docs).not.toMatch(
			new RegExp(`\\bv(?!${version.replaceAll(".", "\\.")})\\d+\\.\\d+\\.\\d+\\b`),
		);
	});
});
