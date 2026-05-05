import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

describe("OpenClaw build", () => {
	it("matches the snapshot", async () => {
		await buildPlatform("openclaw", { rootDir: root });
		const out = await fs.readFile(
			path.join(root, "dist/openclaw/skills/toomanycooks/SKILL.md"),
			"utf8",
		);
		await expect(out).toMatchFileSnapshot("__snapshots__/openclaw.SKILL.md");
	});

	it("emits an mcp-snippet.json", async () => {
		const out = await fs.readFile(
			path.join(root, "dist/openclaw/skills/toomanycooks/mcp-snippet.json"),
			"utf8",
		);
		expect(JSON.parse(out)).toMatchObject({ command: "npx" });
	});
});
