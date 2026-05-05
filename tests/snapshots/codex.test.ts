import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

describe("Codex build", () => {
	it("matches the agents-snippet snapshot", async () => {
		await buildPlatform("codex", { rootDir: root });
		const out = await fs.readFile(path.join(root, "dist/codex/AGENTS.snippet.md"), "utf8");
		await expect(out).toMatchFileSnapshot("__snapshots__/codex.AGENTS.snippet.md");
	});

	it("emits an mcp-snippet.json next to it", async () => {
		const out = await fs.readFile(path.join(root, "dist/codex/mcp-snippet.json"), "utf8");
		expect(JSON.parse(out)).toMatchObject({ command: "npx" });
	});
});
