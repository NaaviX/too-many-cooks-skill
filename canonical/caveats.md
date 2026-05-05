## Caveats to mention proactively

1. **Gross of fees** (unless `simulate_strategy` returned a non-null `netPnlUsd`). Trading fees, gas, withdrawals eat the spread.
2. **Rates flip** — a +30% APR today can be −10% tomorrow. Active monitoring required.
3. **Liquidity matters** — high APR on $50k OI is meaningless (slippage). Apply `minVolume24h: 1000000`, `minOpenInterest: 1000000` when relevance matters.
4. **Not financial advice** — surface market structure, don't recommend trades.
