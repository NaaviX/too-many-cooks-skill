import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export function buildMirrorCommitMessage(args: { sha: string; platform: string }): string {
	return `chore: sync from monorepo @ ${args.sha} (${args.platform})`;
}

const MIRRORS: Record<string, string> = {
	"claude-code-plugin": "https://github.com/toomanycooks/toomanycooks-claude-plugin.git",
	cursor: "https://github.com/toomanycooks/toomanycooks-cursor.git",
};

interface MirrorOptions {
	platform: string;
	sourceDir: string;
	token: string;
}

async function mirror(opts: MirrorOptions): Promise<void> {
	const remote = MIRRORS[opts.platform];
	if (!remote) {
		throw new Error(`No mirror configured for platform "${opts.platform}"`);
	}

	const sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `tmc-mirror-${opts.platform}-`));
	const authedRemote = remote.replace("https://", `https://x-access-token:${opts.token}@`);

	try {
		execSync(`git clone --depth 1 ${authedRemote} ${tmpDir}`, { stdio: "inherit" });
		execSync(`rsync -a --delete --exclude='.git/' ${opts.sourceDir}/ ${tmpDir}/`, {
			stdio: "inherit",
		});
		execSync(`git -C ${tmpDir} add -A`, { stdio: "inherit" });

		const status = execSync(`git -C ${tmpDir} status --porcelain`, { encoding: "utf8" });
		if (status.trim().length === 0) {
			console.log(`[${opts.platform}] no changes — skipping push`);
			return;
		}

		const msg = buildMirrorCommitMessage({ sha, platform: opts.platform });
		execSync(`git -C ${tmpDir} commit -m "${msg}"`, { stdio: "inherit" });
		execSync(`git -C ${tmpDir} push origin HEAD:main`, { stdio: "inherit" });
		console.log(`[${opts.platform}] pushed`);
	} finally {
		await fs.rm(tmpDir, { recursive: true, force: true });
	}
}

async function main() {
	const platformArg = process.argv.find((a) => a.startsWith("--platform="));
	if (!platformArg) {
		throw new Error("Usage: tsx scripts/mirror.ts --platform=<name>");
	}
	const platform = platformArg.split("=")[1] ?? "";
	const token = process.env.MIRROR_PUSH_TOKEN;
	if (!token) {
		throw new Error("MIRROR_PUSH_TOKEN env var is required");
	}
	const rootDir = path.resolve(import.meta.dirname, "..");
	await mirror({
		platform,
		sourceDir: path.join(rootDir, "dist", platform),
		token,
	});
}

const isEntry = import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
