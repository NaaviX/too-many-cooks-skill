import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Push a built `dist/<platform>/` tree into a dedicated mirror repo, for
 * marketplaces that require a standalone repository.
 *
 * Usage: `npm run mirror -- --platform=<name> --repo=<git-url> [--message=<msg>]`
 *
 * Auth: relies on the ambient git credential helper (or a token baked into the
 * remote URL by CI, e.g. https://x-access-token:${MIRROR_PUSH_TOKEN}@github.com/…).
 * No-ops silently when the mirror is already up to date.
 */

interface Args {
	platform: string;
	repo: string;
	message: string;
}

function parseArgs(argv: string[]): Args {
	const get = (flag: string): string | undefined =>
		argv
			.find((a) => a.startsWith(`--${flag}=`))
			?.split("=")
			.slice(1)
			.join("=");
	const platform = get("platform");
	const repo = get("repo");
	if (!platform || !repo) {
		throw new Error(
			"Usage: npm run mirror -- --platform=<name> --repo=<git-url> [--message=<msg>]",
		);
	}
	const sha = process.env.GITHUB_SHA ?? "local";
	return { platform, repo, message: get("message") ?? `chore: sync from monorepo @ ${sha}` };
}

async function main(): Promise<void> {
	const { platform, repo, message } = parseArgs(process.argv.slice(2));
	const rootDir = path.resolve(import.meta.dirname, "..");
	const distDir = path.join(rootDir, "dist", platform);
	await fs.access(distDir); // throws if the platform wasn't built

	const work = await fs.mkdtemp(path.join(os.tmpdir(), "tmc-mirror-"));
	const run = (cmd: string, cmdArgs: string[], cwd: string) =>
		execFileSync(cmd, cmdArgs, { cwd, stdio: "inherit" });

	run("git", ["clone", "--depth", "1", repo, work], rootDir);
	// Replace tracked content (preserve .git) with the freshly built tree.
	for (const entry of await fs.readdir(work)) {
		if (entry === ".git") continue;
		await fs.rm(path.join(work, entry), { recursive: true, force: true });
	}
	await fs.cp(distDir, work, { recursive: true });

	run("git", ["add", "-A"], work);
	const status = execFileSync("git", ["status", "--porcelain"], { cwd: work }).toString();
	if (status.trim().length === 0) {
		console.log(`mirror(${platform}): already up to date, nothing to push`);
		await fs.rm(work, { recursive: true, force: true });
		return;
	}
	run("git", ["commit", "-m", message], work);
	run("git", ["push", "origin", "HEAD"], work);
	console.log(`mirror(${platform}): pushed → ${repo}`);
	await fs.rm(work, { recursive: true, force: true });
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
