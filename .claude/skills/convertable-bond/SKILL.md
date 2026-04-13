---
name: convertable-bond
description: Generate Convertible Bond (CB) valuation reports. Use this skill whenever the user wants to create a convertible bond model, generate a CB report, value a convertible bond, or mentions convertible bond analysis. Also trigger when the user mentions CB pricing, CB valuation, or asks to fill in bond parameters like conversion price, maturity date, or risk-free rate for a bond report.
---

# Convertible Bond Report Generation

This skill generates Convertible Bond valuation reports by collecting parameters from the user and filling them into a pre-built Excel template.

## Template Location

- **Template**: `template/CB_template.xlsx` (relative to this skill folder)
- **Output**: Generated reports go into a `reports/` folder (created if needed)
- **Sheets in template**: `Input`, `Summary`, `Full CB`, `Straight Debt`
- Only the `Input` sheet is modified — the other sheets contain formulas that auto-calculate.
- Some placeholders (e.g. `{{SpotPrice}}`, `{{Volatility}}`, `{{DividendYield}}`, etc.) may appear in multiple sheets. Replace ALL occurrences across the entire workbook.

## Parameters to Collect

Ask the user for each parameter **one by one** in this order:

| # | Parameter | Placeholder | Type | Example |
|---|-----------|-------------|------|---------|
| 1 | ValuationDate | `{{ValuationDate}}` | Date | "June 30, 2025" |
| 2 | IssueDate | `{{IssueDate}}` | Date | "Jan 15, 2025" |
| 3 | Principal | `{{Principal}}` | Number | 100000000 |
| 4 | ConversionPrice | `{{ConversionPrice}}` | Number | 50.00 |
| 5 | MaturityDate | `{{MaturityDate}}` | Date | "Dec 31, 2030" |
| 6 | InterestRate | `{{InterestRate}}` | Percentage | 2.5% |
| 7 | CurrencyUnit | `{{CurrencyUnit}}` | Text | "USD" or " HKD" |
| 8 | RiskFreeRate | `{{RiskFreeRate}}` | Percentage | 4.0% |
| 9 | CreditRiskPremium | `{{CreditRiskPremium}}` | Percentage | 1.5% |
| 10 | LiquidityRiskPremium | `{{LiquidityRiskPremium}}` | Percentage | 1.0% |
| 11 | OtherRisk | `{{OtherRisk}}` | Percentage | 0.5% |
| 12 | FirstDateToPay | `{{FirstDateToPay}}` | Date | "Jun 15, 2025" |
| 13 | SpotPrice | `{{SpotPrice}}` | Number | 45.00 |
| 14 | Volatility | `{{Volatility}}` | Percentage | 30% |
| 15 | DividendYield | `{{DividendYield}}` | Percentage | 2.0% |
| 16 | LastCouponPaymentDate | `{{LastCouponPaymentDate}}` | Date | "Dec 15, 2024" |
| 17 | OutstandingNumberOfShares | `{{OutstandingNumberOfShares}}` | Number | 1000000000 |
| 18 | DilutionEffect | `{{DilutionEffect}}` | 0 or 1 | 1 |

## Workflow

### Step 1: Collect Parameters

Ask for each parameter one at a time. For each one:
- State the parameter name clearly
- Provide a brief description of what it represents
- Give an example value so the user knows the expected format

For **date parameters** (ValuationDate, IssueDate, MaturityDate, FirstDateToPay, LastCouponPaymentDate): accept natural language like "June 30, 2025" or "2025-06-30".

For **percentage parameters** (InterestRate, RiskFreeRate, CreditRiskPremium, LiquidityRiskPremium, OtherRisk, Volatility, DividendYield): accept percentage notation (e.g. "2.5%", "4%") and convert to decimal (0.025, 0.04) for the replacement value.

For **DilutionEffect**: accept 0 or 1 only. Explain that 1 means dilution is considered, 0 means it is not.

### Step 2: Prepare Replacement Values

Before invoking the xlsx skill, prepare the replacement map:

- **Date fields** → convert to Excel DATE formula: `=DATE(year, month, day)`
  - Example: "June 30, 2025" becomes `=DATE(2025,6,30)`
  - Example: "Dec 31, 2030" becomes `=DATE(2030,12,31)`

- **Number fields** → use the numeric value as-is

- **Text fields** → use the string value as-is

Build a complete replacement map. For percentage fields, write the decimal value and apply percentage number format (`0.0%`) so Excel displays them correctly. Search ALL sheets for each placeholder — some appear in multiple sheets:
```
{{ValuationDate}}       → =DATE(year,month,day)
{{IssueDate}}           → =DATE(year,month,day)
{{Principal}}           → <number>
{{ConversionPrice}}     → <number>
{{MaturityDate}}        → =DATE(year,month,day)
{{InterestRate}}        → <decimal> with cell format 0.0%
{{CurrencyUnit}}        → <text>
{{RiskFreeRate}}        → <decimal> with cell format 0.0%
{{CreditRiskPremium}}   → <decimal> with cell format 0.0%
{{LiquidityRiskPremium}} → <decimal> with cell format 0.0%
{{OtherRisk}}           → <decimal> with cell format 0.0%
{{FirstDateToPay}}      → =DATE(year,month,day)
{{SpotPrice}}           → <number>
{{Volatility}}          → <decimal> with cell format 0.0%
{{DividendYield}}       → <decimal> with cell format 0.0%
{{LastCouponPaymentDate}} → =DATE(year,month,day)
{{OutstandingNumberOfShares}} → <number>
{{DilutionEffect}}      → 0 or 1
```

### Step 3: Generate Report

Invoke the `xlsx` skill to:
1. Copy `template/CB_template.xlsx` to `reports/CB_report_<ValuationDate>.xlsx` (use the date in YYYYMMDD format for the filename)
2. Scan ALL sheets for `{{Placeholder}}` values and replace every occurrence with the corresponding prepared value
3. Apply percentage cell format (`0.0%`) to all percentage fields
4. Save the file
5. Run `scripts/recalc.py` to recalculate all formulas across all sheets

### Step 4: Confirm

Report the generated file path to the user and confirm all parameters were applied correctly.

## Important Notes

- Date values must be Excel DATE formulas, not plain text, so that downstream date calculations work correctly.
