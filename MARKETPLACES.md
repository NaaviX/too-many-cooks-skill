# Marketplaces — submission checklist

Living checklist of where Too Many Cooks is submitted, plus what each marketplace asks for. Update when a submission lands or a new marketplace appears.

## v1 launch — submit at first stable build

### Claude Plugin Marketplace (Anthropic)

- **URL:** https://platform.claude.com/plugins/submit
- **Source repo:** https://github.com/toomanycooks/toomanycooks-claude-plugin (mirrored from `dist/claude-code-plugin/`)
- **Required:** plugin name, description, manifest URL, screenshots (≥ 2), category
- **Status:** [ ] submitted [ ] approved [ ] live
- **Notes:** Anthropic re-validates on version bump. SLA unknown — likely days-to-weeks.

### Cursor Directory

- **URL:** https://cursor.directory (community PR)
- **Source repo:** https://github.com/toomanycooks/toomanycooks-cursor (mirrored from `dist/cursor/`)
- **Required:** PR adding metadata file under `rules/` of the directory repo, pointing at `toomanycooks-cursor`
- **Status:** [ ] submitted [ ] merged [ ] live

### lobehub.com (multi-platform aggregator)

- **URL:** https://lobehub.com/skills (submission form)
- **Source repo:** main monorepo `toomanycooks-skill`
- **Required:** title, description, supported platforms (Claude / Cursor / Cline / Continue), homepage, license
- **Status:** [ ] submitted [ ] live
- **Notes:** Listing covers multiple platforms in one entry — high ROI.

## Deferred / under consideration

### skillsmp.com

Similar profile to lobehub. Submit if lobehub doesn't drive traction.

### claudemarketplaces.com

Community directory of Claude Code marketplaces. Listing happens automatically once `toomanycooks-claude-plugin` is on the official Anthropic marketplace.

### SkillsOverMCP (https://skillsovermcp.com/)

Allows hosting a GitHub repo of `SKILL.md` as an MCP server. Interesting alternate distribution but uncertain ROI — defer to v1.1.

### OpenClaw skills directory

If OpenClaw publishes a community skills directory after v1 ships, submit then.

### GPT Store

Out of scope for v1 (Family 2 — needs OpenAPI actions, not just markdown). Plan separately.
