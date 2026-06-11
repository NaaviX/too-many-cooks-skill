## Failure modes

- **Auth error** → user should check `TMC_API_KEY` in their MCP config.
- **429 / quota** → suggest waiting for reset or upgrading at https://toomanycooks.app/pricing.
- **Empty strategy results** → volume/OI filters likely too tight; suggest relaxing them.
- **No `toomanycooks` tools callable at all** → the MCP server isn't connected; **don't keep
  retrying** — walk the user through `reference/mcp-troubleshooting.md` (usually a missing `TMC_API_KEY`).
