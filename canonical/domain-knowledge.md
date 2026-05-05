## Non-obvious domain knowledge

- **APRs are returned as decimals** — `0.15` = 15% APR. Multiply by 100 only at display time.
- **Delta-neutral arb**: long the lowest funding APR (pay less / earn more), short the highest (receive funding). Spread = strategy APR.
- **`profitAPR` ≠ `shortFundingRateAPR − longFundingRateAPR`** in general. `profitAPR` is the *average* spread over the `periodDays` lookback window; the long/short rates are the *latest* snapshot. They diverge when rates have moved.
