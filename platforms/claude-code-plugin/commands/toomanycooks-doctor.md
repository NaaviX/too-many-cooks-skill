---
description: Diagnose why the Too Many Cooks MCP tools aren't available and walk through the fix.
---

The user's Too Many Cooks MCP tools aren't registered (no `list_exchanges`,
`find_arbitrage_strategies`, … available). Diagnose and fix it. **Do not just retry the tools** —
the server isn't connected; work through this in order and stop at the first step that resolves it.

The cause is almost always a missing `TMC_API_KEY`. The plugin loads its skill and commands fine
(that's why this command runs), but Claude Code refuses to start the MCP server while the *required*
`api_key` userConfig value is unset.

Steps:

1. **State the likely cause up front.** Tell the user: the MCP tools aren't registered this session,
   almost certainly because the plugin's API key isn't set yet.

2. **Point them to the exact fix (the non-obvious part):**
   - Run `/plugin`.
   - Select **Too Many Cooks → Configure options**.
   - Paste a key in the **TMC API key** field. Free key: https://toomanycooks.app/dashboard/api-keys
     (looks like `tmc_live_…`). It's stored in the OS keychain, not a plain file.
   - The plugin reports *"Plugin option api_key isn't set"* until this is done.

3. **Reload and verify.** After the key is set, have them run `/reload-plugins`, then `/mcp` — the
   `toomanycooks` server should appear (approve the one-time per-server prompt the first time). Tell
   them to re-ask their original funding-rate / arbitrage question.

4. **If it still won't connect, isolate the server.** Ask the user to run, in a terminal:

   ```bash
   TMC_API_KEY=tmc_live_… npx -y @toomanycooks/mcp-server
   ```

   A healthy server prints `[toomanycooks] MCP server vX.Y.Z listening on stdio` (Ctrl-C to exit).
   - If that line appears → the npm package is fine; the issue is Claude Code's config/reload. Have
     them confirm the plugin is **Enabled** in `/plugin` and re-run `/reload-plugins`.
   - If it errors → relay the error (bad key → 401/auth; network/proxy; old Node — needs Node ≥ 20).

Keep it short and sequential. The goal is to get one funding-rate query working, not to lecture.
