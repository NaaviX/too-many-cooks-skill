# Marketplace submission checklist

Living tracker for where Too Many Cooks is listed. Update the status column when
a submission is filed or accepted. Versions come from `canonical/_frontmatter.yml`.

## Requires a dedicated mirror repo

| Marketplace | Mirror repo | Source `dist/` | Status |
|---|---|---|---|
| Claude Plugin Marketplace (`platform.claude.com/plugins/submit`) | `toomanycooks/toomanycooks-claude-plugin` | `dist/claude-code-plugin/` | ☐ not submitted |
| Cursor Directory (`cursor.directory`, PR) | `toomanycooks/toomanycooks-cursor` | `dist/cursor/` | ☐ not submitted |

The mirror repos are fed automatically by `.github/workflows/mirror.yml` on every
push to `main` (needs the `MIRROR_PUSH_TOKEN` secret). Create the two repos once,
then submit each marketplace pointing at its mirror.

The `claude-code-plugin` mirror is a **working plugin marketplace** on its own:
`dist/claude-code-plugin/` ships `.claude-plugin/marketplace.json` (catalog) next
to `.claude-plugin/plugin.json` (the plugin, `source: "."`). So before any
official submission, anyone can already install it directly:

```text
/plugin marketplace add toomanycooks/toomanycooks-claude-plugin
/plugin install toomanycooks@toomanycooks
```

CI gates this with `claude plugin validate dist/claude-code-plugin --strict`
(in `build.yml`) — the same check the community review pipeline runs. To submit
to Anthropic's `claude-community` marketplace, use the form at
`platform.claude.com/plugins/submit` (or `claude.ai/settings/plugins/submit`);
approved plugins are pinned by commit SHA and bumped automatically on push.

## No mirror required (install via README / direct tap)

| Channel | How | Status |
|---|---|---|
| Aggregator (lobehub.com **or** skillsmp.com) | One listing, links back to this repo | ☐ not submitted |
| Hermes — `skills.sh` | Publish the skill listing | ☐ not submitted |
| Hermes — `/.well-known/skills/index.json` self-host on toomanycooks.app | Serve the index, Hermes auto-indexes | ☐ not submitted |
| Hermes — `NousResearch/hermes-agent` PR under `optional-skills/` | Direct PR for official visibility | ☐ not submitted |
| Cline / Continue.dev / Codex / OpenClaw | README copy-paste install | n/a (docs only) |

## CI setup (one-time)

1. Create `toomanycooks/toomanycooks-claude-plugin` and `toomanycooks/toomanycooks-cursor` (empty).
2. Create a PAT with `repo` scope; add it as the `MIRROR_PUSH_TOKEN` secret on this repo.
3. Push to `main` → `mirror.yml` populates both. Verify their contents, then submit.
