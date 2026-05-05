import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildPlatform } from "../../scripts/build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

describe("Hermes build", () => {
	it("matches the system-prompt snapshot", async () => {
		await buildPlatform("hermes", { rootDir: root });
		const out = await fs.readFile(path.join(root, "dist/hermes/system-prompt.md"), "utf8");
		await expect(out).toMatchFileSnapshot("__snapshots__/hermes.system-prompt.md");
	});

	it("emits an mcp-snippet.json", async () => {
		const out = await fs.readFile(path.join(root, "dist/hermes/mcp-snippet.json"), "utf8");
		expect(JSON.parse(out)).toMatchObject({ command: "npx" });
	});
});
