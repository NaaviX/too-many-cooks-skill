# Changelog

All notable changes to the Too Many Cooks agent skill are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The canonical version lives in `canonical/_frontmatter.yml`; the build stamps it
into the README badge, `docs.html`, and `llms.txt`. Add an entry here in the same
commit that bumps that version (CI fails if the entry is missing).

## [Unreleased]

## [1.5.0]

- Multi-platform build pipeline: one canonical source (`canonical/*.md`) fans out
  to Claude Code, Codex, Cursor, Copilot, Hermes, and the `agent-skills` root
  skill consumed by `npx skills add`.
- Lean-core `SKILL.md` with on-demand `reference/*.md` (tool params,
  personalization, advanced workflows, MCP troubleshooting).
- `/toomanycooks` slash dispatch plus `/toomanycooks-setup`, `-help`, `-doctor`
  companion commands in the Claude Code plugin.
- CI mirrors marketplace-bound outputs to standalone repos (see `MARKETPLACES.md`).

[Unreleased]: https://github.com/NaaviX/too-many-cooks-skill/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/NaaviX/too-many-cooks-skill/releases/tag/v1.5.0
