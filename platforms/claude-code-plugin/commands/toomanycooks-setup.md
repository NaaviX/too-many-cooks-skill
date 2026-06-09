---
description: Personalize Too Many Cooks — pick default exchanges, liquidity floors, and risk tolerance.
---

Run an interactive setup that captures the user's Too Many Cooks defaults and writes them to `~/.toomanycooks/preferences.md`. The `toomanycooks` skill reads this file on every funding-rate / arbitrage query, so future answers are personalized.

Steps:

1. If `~/.toomanycooks/preferences.md` already exists, read it first and present its current values as the starting point (this is a re-configure, not a reset).
2. Optionally call `list_exchanges` to show the live supported venues (lowercase keys) before asking.
3. Use `AskUserQuestion` to collect the following — offer the common choices and let the user pick "Other":
   - **Exchanges** (multi-select) — venues to focus on, e.g. HyperLiquid, Lighter, Extended, Aster, Paradex, EdgeX. Include an "All exchanges" option.
   - **Risk tolerance** — conservative / balanced / aggressive.
   - **Liquidity floor** — applied to both `minVolume24h` and `minOpenInterest`: $1M / $5M / none.
   - **Default result count** — 3 / 5 / 10.
   - **Default funding window** — 1 / 7 / 30 days (`periodDays`).
4. Write the answers to `~/.toomanycooks/preferences.md` using **exactly** this format (lowercase exchange keys; `exchanges: all` means no venue filter):

   ```
   # Too Many Cooks — user preferences
   # Written by /toomanycooks-setup. Edit by hand or re-run /toomanycooks-setup anytime.

   exchanges: hyperliquid, lighter, extended
   minVolume24h: 1000000
   minOpenInterest: 1000000
   count: 5
   periodDays: 7
   riskTolerance: balanced
   quote: USDC
   ```

5. Confirm the saved path and summarize the chosen defaults. Tell the user they can re-run `/toomanycooks-setup` or edit the file directly, and that inline instructions always override these defaults.
