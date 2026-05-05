import { describe, expect, it } from "vitest";
import { buildMirrorCommitMessage } from "../scripts/mirror.js";

describe("mirror", () => {
	it("formats a deterministic commit message", () => {
		expect(buildMirrorCommitMessage({ sha: "abc1234", platform: "cursor" })).toBe(
			"chore: sync from monorepo @ abc1234 (cursor)",
		);
	});
});
