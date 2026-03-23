---
name: per-option-value
description: Generate ESO (Employee Stock Option) valuation reports using the John Hull Enhanced FASB 123 trinomial tree model. Use this skill when the user needs to value employee stock options, calculate per-option values, or generate ESO valuation reports. 
---

# Per-Option Value Calculator (John Hull ESO Model)

This skill calculates the fair value of employee stock options using the Enhanced FASB 123 trinomial tree methodology developed by John Hull, then generates a valuation report.

## Workflow

1. Collect all required information from the user
2. Calculate derived parameters from dates
3. Run the per-option value calculation
4. Fill the report template with all data

## Step 1: Collect Information from User

Collect parameters **one by one** in a conversational manner. Ask for one parameter, wait for the user's response, then ask for the next one. Do not present all questions at once.

**Asking order:**

1. Valuation Date
2. Grant Date of the Subject
3. Maturity Date
4. Exercise Price
5. Vesting Date
6. Report Recipient (Employee / Director / Both)
7. Stock Price (`--S`)
8. Strike Price (`--K`)
9. Volatility (`--V`) - Annual volatility (decimal)
10. Risk-free Rate (`--R`) - Annual risk-free rate (decimal)
11. Dividend Yield (`--Q`) - Annual dividend yield (decimal)
12. Post-vest Exit Rate (`--postVest`) - Annual exit rate after vesting

**Date Format:** Use format "12 December 2023" (day month year) for all dates.

**Default Values (do not ask):**
- Pre-vest Exit Rate (`--preVest`): 0.0
- Exercise Multiple (`--exMult`): 2.2 for Employee, 2.8 for Director (based on Report Recipient)

After collecting all parameters, proceed to Step 2.

### Default Values (no user input needed)

These parameters use fixed defaults and should not be asked from the user:

| Parameter | Default Value |
|-----------|---------------|
| Pre-vest Exit Rate (`--preVest`) | 0.0 |

Still pass these defaults to the calculation and xlsx skill.

### Exercise Multiple Rules

The Exercise Multiple has conditional defaults based on the report recipient:

| Recipient | Default Exercise Multiple |
|-----------|---------------------------|
| Employee | 2.2 |
| Director | 2.8 |

**Important - "Both" Recipient Handling:**
If Report Recipient is "Both", you must run the calculation script **twice**:
1. First run: Exercise Multiple = 2.2 (Employee calculation)
2. Second run: Exercise Multiple = 2.8 (Director calculation)

Keep both calculation results - you will pass them to the xlsx skill together so the report contains both values.

If the user specifies a custom Exercise Multiple, use that value instead of the default.

- [ ] Exercise Multiple (`--exMult`) - Provided: ___ (or default based on recipient: ___)

## Step 2: Calculate Derived Parameters

Calculate these values from the dates provided:

| Derived Parameter | Calculation |
|-------------------|-------------|
| Time to Maturity (`--T`) | Maturity Date - Valuation Date (in years) |
| Time to Vest (`--vestTime`) | Vesting Date - Grant Date of the Subject (in years) |

Show the user the calculated values before proceeding.

## Step 3: Run the Calculation

The script is bundled with this skill. Run it from the project root:

```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts [options]
```

### Example Usage

```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts \
  --S 50.0 \
  --K 45.0 \
  --T 5.0 \
  --V 0.35 \
  --R 0.04 \
  --Q 0.02 \
  --exMult 2.2 \
  --preVest 0.05 \
  --postVest 0.0 \
  --vestTime 2.0
```

### Show help:
```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts --help
```

## Step 4: Generate the Report

After the calculation completes, fill the report template with all collected and calculated data.

**Template Location:** `.claude/skills/template/ESO_VD231212_v1.xlsm`

Invoke the xlsx skill and pass ALL of the following data explicitly:

**Report Information:**
- Valuation Date
- Grant Date of the Subject
- Maturity Date
- Exercise Price
- Vesting Date
- Report Recipient (Employee / Director / Both)

**Calculation Parameters:**
- Stock Price
- Strike Price (same as Exercise Price)
- Volatility
- Risk-free Rate
- Dividend Yield
- Exercise Multiple (2.2 for Employee, 2.8 for Director)
- Pre-vest Exit Rate
- Post-vest Exit Rate

**Derived Values:**
- Time to Maturity (years)
- Time to Vest (years)

**Calculated Results:**
- If Employee: Per-Option Value from exMult 2.2 run
- If Director: Per-Option Value from exMult 2.8 run
- If Both:
  - Employee Per-Option Value: [result from exMult 2.2 run]
  - Director Per-Option Value: [result from exMult 2.8 run]

The xlsx skill needs all these values to fill the template correctly.

Save the completed report and provide the file path to the user.
