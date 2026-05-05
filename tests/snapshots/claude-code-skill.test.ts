import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

describe("Claude Code skill build", () => {
	it("matches the snapshot", async () => {
		await buildPlatform("claude-code-skill", { rootDir: root });
		const out = await fs.readFile(path.join(root, "dist/claude-code-skill/SKILL.md"), "utf8");
		await expect(out).toMatchFileSnapshot("__snapshots__/claude-code-skill.SKILL.md");
	});
});
