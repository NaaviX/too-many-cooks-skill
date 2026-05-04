# Setup for Hermes (Nous Research)

Hermes accepts MCP servers as agent tools. The exact config path depends on your Hermes deployment (local vs. hosted via https://hermes-agent.nousresearch.com/).

## 1. Get an API key

Free tier at https://toomanycooks.app/dashboard/api-keys.

## 2. Configure the MCP server

Hermes uses an `agent.json` (or equivalent) config. Add a server entry:

```json
{
  "mcp_servers": {
    "toomanycooks": {
      "command": "npx",
      "args": ["-y", "@toomanycooks/mcp-server"],
      "env": {
        "TMC_API_KEY": "tmc_live_..."
      }
    }
  }
}
```

For hosted Hermes (which doesn't run npx for you), wrap the server behind a public stdio→HTTP bridge or use the SDK directly inside an agent action — see https://hermes-agent.nousresearch.com/docs/ for the current best practice.

## 3. Add domain instructions

Hermes agents work best with explicit task prompts. Use one of these patterns:

### Inline action prompt

```
You have access to the toomanycooks MCP server. To answer questions about
crypto funding rates or delta-neutral arbitrage, call:
  - list_exchanges
  - get_funding_rates(exchange)
  - get_historical_funding(exchange, tickers, periodDays)
  - find_arbitrage_strategies(count, periodDays, exchanges?, minVolume24h?, minOpenInterest?)
  - compare_exchanges_for_ticker(ticker, exchanges?)
  - whoami

Funding rates are returned as decimal APR (0.15 = 15%). Always disclose that
profit estimates are gross of fees and that funding rates can flip.
```

### Persistent agent role

Configure the agent's role description to mention "expert in crypto perpetuals funding rate arbitrage with access to live data via MCP". The Hermes runtime will route relevant questions to the toomanycooks tools automatically.

## 4. Verify

Run:

```
What are the top 5 delta-neutral arbitrage opportunities right now on
exchanges with at least $1M of 24h volume?
```

The agent should call `find_arbitrage_strategies` with `minVolume24h: 1_000_000` and return a structured answer.

## Notes

- **Latency**: hosted Hermes calls the MCP server through a network hop — expect ~200-500ms additional latency vs. running locally.
- **Quota counts against your key**: the agent's calls hit your daily/monthly quota. For high-frequency Hermes deployments, upgrade to Pro or Quant tier.
- **Direct SDK alternative**: if MCP integration is brittle in your Hermes setup, you can also call the SDK directly from an agent action: `import { TmcApiClient } from "@toomanycooks/sdk"`. The MCP tools and the SDK methods are 1:1 equivalent.
