## Failure modes

- **Auth error** → user should check `TMC_API_KEY` in their MCP config.
- **429 / quota** → suggest waiting for reset or upgrading at https://toomanycooks.app/pricing.
- **Empty strategy results** → volume/OI filters likely too tight; suggest relaxing them.
- **Stale data warning** → call `get_exchange_status` to confirm; flag to the user before recommending a trade if `healthy` is false.
