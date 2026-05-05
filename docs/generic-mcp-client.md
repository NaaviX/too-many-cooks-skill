# Setup for any MCP-compatible client

The Too Many Cooks MCP server speaks **stdio JSON-RPC 2.0**, the standard MCP transport. Any client that implements MCP can use it — including custom agents you build yourself.

## Spawn the server

```bash
TMC_API_KEY=tmc_live_xxx npx -y @toomanycooks/mcp-server
```

The process listens on `stdin` for JSON-RPC requests and writes responses to `stdout`. Logs go to `stderr` so they don't pollute the protocol stream.

## Discover tools

Send `tools/list` to enumerate the 6 tools and their JSON Schema:

```json
{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}
```

Response will include `find_arbitrage_strategies`, `get_funding_rates`, `compare_exchanges_for_ticker`, `get_historical_funding`, `list_exchanges`, `whoami`.

## Call a tool

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "find_arbitrage_strategies",
    "arguments": { "count": 5, "periodDays": 7, "minVolume24h": 1000000 }
  }
}
```

Response `content[0].text` is JSON-encoded. Parse it client-side.

## Skip MCP, use the SDK directly

If you're building a custom agent and don't need the MCP transport overhead, just import the SDK:

```ts
import { TmcApiClient } from "@toomanycooks/sdk";

const client = new TmcApiClient(); // reads TMC_API_KEY from env
const strategies = await client.findStrategies({
  count: 5,
  periodDays: 7,
  minVolume24h: 1_000_000,
});
```

The SDK and MCP server are 1:1 equivalent — the MCP server is literally a thin adapter on top of the SDK. For agents written in TypeScript or JavaScript, the SDK is more direct and gives you full type safety.

For non-Node runtimes (Python, Go, Rust), call the REST API directly:

```bash
curl https://api.antoine-legrand.dev/api/v1/strategies/delta-neutral?count=5 \
  -H "Authorization: Bearer tmc_live_..."
```

See https://api.antoine-legrand.dev/api-docs for the full OpenAPI spec.

## Quota awareness

Every response includes `X-RateLimit-*` headers. Inspect them to back off proactively before hitting 429:

```
X-RateLimit-Limit-Daily: 10000
X-RateLimit-Remaining-Daily: 9847
X-RateLimit-Reset-Daily: 1714521600
```

When you do hit 429, the response carries `Retry-After` (in seconds) — respect it.
