---
name: release
description: Cut a new release of the Too Many Cooks skill — bump the single version source, rebuild all platforms, re-bless snapshots, validate the Claude Code plugin, and commit. Use when the user wants to ship a meaningful skill release or bump the version.
disable-model-invocation: true
---

# Release the skill

There is exactly one version source: `version:` in `canonical/_frontmatter.yml`. Every platform's
frontmatter and plugin manifest gets it stamped at build time via the `"$version"` token, so a
release is: bump that one number, regenerate, re-bless, verify, commit.

## Steps

1. **Confirm the new version.** Read the current `version:` in `canonical/_frontmatter.yml` and
   agree on the bump (patch / minor / major) with the user based on what changed since the last
   release. Edit only that line.

2. **Rebuild every platform:**
   ```bash
   npm run build
   ```
   This restamps the version across all `dist/<platform>/` artifacts and plugin manifests.

3. **Re-bless snapshots:**
   ```bash
   npm test -- -u
   ```
   The version bump alone changes frontmatter in most snapshots, so this *will* show diffs —
   that's expected. Skim the diff to confirm the only changes are the version (plus whatever
   content you intended to ship); a snapshot diff touching unexpected content means a stray edit.

4. **Validate the Claude Code plugin** (same gate CI runs):
   ```bash
   npx -y @anthropic-ai/claude-code plugin validate dist/claude-code-plugin --strict
   ```

5. **Lint:** `npm run check` (Biome). Fix with `npm run check:fix` if needed.

6. **Commit** the canonical version bump, the updated `tests/snapshots/*.snap.md`, and any
   canonical/recipe content that's part of this release. Do **not** commit `dist/` (gitignored).
   Use a conventional message, e.g. `chore: release skill vX.Y.Z`.

7. **Distribution is automatic.** On push to `main`, `.github/workflows/mirror.yml` pushes the
   selected `dist/<platform>/` trees to the marketplace mirror repos. Don't push mirror trees by
   hand. If a brand-new platform needs mirroring, that's a `mirror.yml` matrix change, not part
   of a routine release — flag it rather than improvising.

## Guardrails

- Never hardcode a version number in a recipe or snapshot — the only place it's authored is
  `canonical/_frontmatter.yml`.
- If `npm test` is red for any reason other than the intended version/content diff, stop and
  resolve it before committing.
