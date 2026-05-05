import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { buildPlatform } from "../scripts/build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

describe("buildPlatform", () => {
	const distDir = path.join(root, "dist", "_test-fixture");

	afterAll(async () => {
		await fs.rm(distDir, { recursive: true, force: true });
	});

	it("assembles canonical blocks with header and frontmatter for a fixture platform", async () => {
		await buildPlatform("_test-fixture", { rootDir: root });
		const out = await fs.readFile(path.join(root, "dist/_test-fixture/output.md"), "utf8");
		expect(out).toMatch(/^---\nname: toomanycooks\n/);
		expect(out).toContain("# Header for the fixture");
		expect(out).toContain("Quick decision tree");
	});
});
