import { describe, expect, it } from "vitest";
import { renderMcpSnippet } from "../scripts/extras.js";

describe("renderMcpSnippet", () => {
	const snippet = {
		command: "npx",
		args: ["-y", "@toomanycooks/mcp-server"],
		env: { TMC_API_KEY: "tmc_live_..." },
	};

	it("formats as JSON with 2-space indent", () => {
		const out = renderMcpSnippet(snippet, "json");
		expect(out).toContain('"command": "npx"');
		expect(out).toContain('"@toomanycooks/mcp-server"');
		expect(JSON.parse(out)).toEqual(snippet);
	});

	it("formats as JSONC (same as JSON for now)", () => {
		const out = renderMcpSnippet(snippet, "jsonc");
		expect(out).toContain('"@toomanycooks/mcp-server"');
	});

	it("formats as YAML", () => {
		const out = renderMcpSnippet(snippet, "yaml");
		expect(out).toContain("command: npx");
		expect(out).toContain("TMC_API_KEY:");
	});
});
