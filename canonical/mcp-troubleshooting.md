## No Too Many Cooks tools available (MCP not registered)

If none of the `toomanycooks` tools (`list_exchanges`, `find_arbitrage_strategies`, …) are
callable, the MCP server isn't connected for this session. **Don't keep retrying** — walk the
user through this checklist, in order. The cause is almost always a missing `TMC_API_KEY`.

1. **Confirm the server is configured.** It must be registered for the platform — a Claude Code /
   Codex **plugin** that's *enabled*, or an `mcpServers.toomanycooks` entry in the platform's MCP
   config file (`.mcp.json`, `~/.cursor/mcp.json`, `.vscode/mcp.json`, …).
2. **Check the API key (the usual culprit).** The config needs `TMC_API_KEY=tmc_live_…`. A free key
   is at https://toomanycooks.app/dashboard/api-keys. **Plugin users:** the key is a *required*
   `userConfig` value — open `/plugin`, select **Too Many Cooks → Configure options**, and paste it
   there (it's stored in the OS keychain, not a plain file). The plugin shows
   *"Plugin option api_key isn't set"* until you do.
3. **Reload.** After setting the key, run `/reload-plugins` (or restart the agent) and re-check
   `/mcp` — the server may need a one-time per-server approval the first time.
4. **Prove the server boots, in isolation.** If it still won't connect, the user can run, in a
   terminal: `TMC_API_KEY=tmc_live_… npx -y @toomanycooks/mcp-server`. A healthy server prints
   `[toomanycooks] MCP server vX.Y.Z listening on stdio`. If that line appears, the package is fine
   and the problem is the agent's config/reload; if it errors, surface that error.
