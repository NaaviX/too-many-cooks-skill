## Non-obvious domain knowledge

- **APRs are returned as decimals** — `0.15` = 15% APR. Multiply by 100 only at display time.
- **Delta-neutral arb**: long the lowest funding APR (pay less / earn more), short the highest (receive funding). Spread = strategy APR.
- **`profitAPR` ≠ `shortFundingRateAPR − longFundingRateAPR`** in general. `profitAPR` is the *average* spread over the `periodDays` lookback window; the long/short rates are the *latest* snapshot. They diverge when rates have moved.
- **`get_funding_spikes` is cross-exchange, not cross-time.** It compares each exchange to the peer mean for the same ticker right now — that's what reveals an arbitrage gap, not a temporal anomaly.
- **`simulate_strategy` `executionCostUsd` is null** when either venue isn't in the execution-cost subsystem. The funding-only `fundingPnlUsd` is always returned.
- **`get_exchange_status.healthy` is false past 30 min** since the last cron write — the cron runs every 10 min, so a "stale" exchange is one that's missed three cycles in a row.
