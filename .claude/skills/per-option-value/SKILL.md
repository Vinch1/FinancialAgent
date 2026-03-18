---
name: per-option-value
description: Calculate per-option value for employee stock options (ESOs) using the John Hull Enhanced FASB 123 trinomial tree model. Use this skill whenever the user asks about ESO valuation, employee stock option pricing, per-option value calculations, option expensing under ASC 718/FAS 123, or needs to value stock options with vesting, forfeiture, and early exercise behavior.
---

# Per-Option Value Calculator (John Hull ESO Model)

This skill calculates the fair value of employee stock options using the Enhanced FASB 123 trinomial tree methodology developed by John Hull. This model accounts for:

- **Vesting periods** - Options cannot be exercised before vesting
- **Forfeiture rates** - Employee departures before and after vesting
- **Early exercise behavior** - Employees tend to exercise when stock price exceeds a multiple of strike price
- **Dividend yield** - Continuous dividend payments on the underlying stock

## When to Use This Skill

Use this skill when the user needs to:
- Calculate the fair value of employee stock options for accounting purposes (ASC 718/FAS 123R)
- Value ESOs for compensation expense recognition
- Determine per-option value for option grant valuation
- Model option exercise behavior with vesting and forfeiture assumptions

## How to Run the Calculation

The script is bundled with this skill. Run it from the project root:

```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts [options]
```

When invoking this skill, run the script with the user's parameters.

## Input Parameters

| Parameter | Flag | Description | Default |
|-----------|------|-------------|---------|
| Stock Price | `--S` | Current stock price | 0.101 |
| Strike Price | `--K` | Exercise/strike price | 0.180 |
| Total Term | `--T` | Option life in years | 2.0 |
| Volatility | `--V` | Annual volatility (decimal) | 0.5084 |
| Risk-free Rate | `--R` | Annual risk-free rate (decimal) | 0.0387 |
| Dividend Yield | `--Q` | Annual dividend yield (decimal) | 0.0 |
| Exercise Multiple | `--exMult` | Stock price / Strike ratio at which employees exercise | 1.44 |
| Pre-vest Exit Rate | `--preVest` | Annual forfeiture rate before vesting | 0.0 |
| Post-vest Exit Rate | `--postVest` | Annual exit rate after vesting | 0.2485 |
| Vesting Time | `--vestTime` | Years until options vest | 1.0 |

## Example Usage

### Basic calculation with default parameters:
```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts
```

### Custom valuation:
```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts \
  --S 50.0 \
  --K 45.0 \
  --T 5.0 \
  --V 0.35 \
  --R 0.04 \
  --Q 0.02 \
  --exMult 2.0 \
  --preVest 0.05 \
  --postVest 0.10 \
  --vestTime 2.0
```

### Show help:
```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts --help
```

## Output Format

The script outputs JSON with the calculated per-option value:

```json
{
  "inputs": {
    "S": 0.101,
    "K": 0.18,
    "T": 2,
    "Vol": 0.5084,
    "r": 0.0387,
    "q": 0,
    "exMult": 1.44,
    "preVest": 0,
    "postVest": 0.2485,
    "vestTime": 1
  },
  "PerOptionValue": 0.011
}
```

## Model Assumptions

The John Hull Enhanced FASB 123 model uses these key assumptions:

1. **Trinomial tree** with 200 time steps for numerical accuracy
2. **Exercise behavior**: Employees exercise when stock price >= (exercise multiple × strike price)
3. **Forfeiture handling**: Pre-vest exits result in complete forfeiture; post-vest exits trigger immediate exercise of in-the-money options
4. **Interpolation**: When exercise multiple is very close to current price/strike ratio, the model interpolates between two boundary cases

## Parameter Selection Guidance

### Exercise Multiple
- 1.0 = Exercise immediately when in-the-money (aggressive)
- 1.5-2.0 = Common range based on empirical studies
- Higher values = More conservative (higher option value)

### Exit/Forfeiture Rates
- Pre-vest: Typically 3-8% annually depending on company/industry
- Post-vest: Often lower than pre-vest; consider employee turnover data

### Volatility
- Use historical volatility of the stock (typically 30-60% for growth companies)
- Can also use implied volatility from traded options if available

### Vesting Period
- Common: 1-4 years (cliff or graded vesting)
- For graded vesting, run multiple calculations with different vest times and weight appropriately
