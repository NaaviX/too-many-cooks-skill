---
description: Show what Too Many Cooks can do — slash actions, companion commands, and example questions.
---

Give the user a one-screen orientation to the Too Many Cooks plugin. No MCP calls needed — this is
a static cheat-sheet. Use the bundled `toomanycooks` skill as the source of truth; load it via the
Skill tool if it isn't in context yet.

Present, in this order, keeping the whole answer compact:

1. **One-liner** — crypto perpetuals funding rates + delta-neutral arbitrage across 25 DEX
   exchanges, powered by the bundled `@toomanycooks/mcp-server`.

2. **Quick actions** — `/toomanycooks <action>` dispatches straight to the right tool. Render the
   action table from the skill's "Slash-command arguments" section in compact form (action + args +
   one-phrase purpose). Lead with the everyday four: `rates <TICKER>`, `arb [count]`,
   `best <TICKER>`, `simulate <TICKER> <long> <short>`.

3. **Companion commands**
   - `/toomanycooks-setup` — personalize defaults (exchanges, liquidity floors, risk tolerance);
     writes `~/.toomanycooks/preferences.md`, read on every query.
   - `/toomanycooks-doctor` — fix "MCP tools not available" (almost always a missing API key).

4. **Natural language works too** — two or three examples: *"Show me the top 5 delta-neutral
   arbitrage opportunities right now"*, *"Compare BTC funding rates across HyperLiquid, Lighter,
   and Extended"*, *"How has ETH funding evolved this past week?"*.

5. **Key & quota** — free key (100 req/day) at https://toomanycooks.app/dashboard/api-keys, set via
   `/plugin` → Too Many Cooks → Configure options. `/toomanycooks whoami` reports plan + quota.

If the user passed an argument (`/toomanycooks-help <topic>`), skip the overview and answer that
topic directly from the skill — e.g. `simulate` → explain the simulate action's arguments and
defaults.
