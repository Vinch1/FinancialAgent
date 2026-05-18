---
name: convertable-bond
description: Generate Convertible Bond (CB) valuation reports. Use this skill whenever the user wants to create a convertible bond model, generate a CB report, value a convertible bond, or mentions convertible bond analysis. Also trigger when the user mentions CB pricing, CB valuation, or asks to fill in bond parameters like conversion price, maturity date, or risk-free rate for a bond report.
---

# Convertible Bond Report Generation

This skill generates Convertible Bond valuation reports by collecting parameters from the user and filling them into a pre-built Excel template.

## Template Location

- **Template**: `template/CB_Template.xlsx` (relative to this skill folder)
- **Output**: Generated reports go into a `reports/` folder (created if needed)
- **Sheets in template**: `Input`, `Summary`, `Full CB`, `Straight Debt`
- Only the `Input` sheet is modified — the other sheets contain formulas that auto-calculate.
- Some placeholders (e.g. `{{SportPrice}}`, `{{Volatility}}`, `{{DividendYield}}`, etc.) may appear in multiple sheets. Replace ALL occurrences across the entire workbook.

## Parameters to Collect

Ask the user for each parameter **one by one** in this order:

| # | Parameter | Placeholder | Type | Example |
|---|-----------|-------------|------|---------|
| 1 | DayBasis | `{{DayBasis}}` | Integer | 3 |
| 2 | ValuationDate | `{{ValuationDate}}` | Date | "June 30, 2025" |
| 3 | IssueDate | `{{IssueDate}}` | Date | "Jan 15, 2025" |
| 4 | Principal | `{{Principal}}` | Number | 100000000 |
| 5 | ConversionPrice | `{{ConversionPrice}}` | Number | 50.00 |
| 6 | MaturityDate | `{{MaturityDate}}` | Date | "Dec 31, 2030" |
| 7 | InterestRate | `{{InterestRate}}` | Percentage | 2.5% |
| 8 | CouponFrequency | *(variable, no placeholder)* | Choice | "Annually", "Semi-annually", or "Quarterly" |
| 9 | CurrencyUnit | `{{CurrencyUnit}}` | Text | "USD" or " HKD" |
| 10 | RiskFreeRate | `{{RiskFreeRate}}` | Percentage | 4.0% |
| 11 | DiscountRate | `{{DiscountRate}}` | Percentage | 5.0% |
| 12 | SportPrice | `{{SportPrice}}` | Number | 45.00 |
| 13 | Volatility | `{{Volatility}}` | Percentage | 30% |
| 14 | DividendYield | `{{DividendYield}}` | Percentage | 2.0% |
| 15 | LastCouponPaymentDate | `{{LastCouponPaymentDate}}` | Date | "Dec 15, 2024" |
| 16 | DilutionEffect | `{{DilutionEffect}}` | 0 or 1 | 1 |

**Optional Parameters (ask after all required parameters):**

| # | Parameter | Placeholder | Type | Example |
|---|-----------|-------------|------|---------|
| 17 | CallStartDate | `{{CallStartDate}}` | Date | "Jun 15, 2026" |
| 18 | CallEndDate | `{{CallEndDate}}` | Date | "Dec 31, 2029" |
| 19 | PutStartDate | `{{PutStartDate}}` | Date | "Jun 15, 2027" |
| 20 | PutEndDate | `{{PutEndDate}}` | Date | "Dec 31, 2029" |
| 21 | CallPrice | `{{CallPrice}}` | Number | 105.00 |
| 22 | PutPrice | `{{PutPrice}}` | Number | 98.00 |

## Workflow

### Step 1: Collect Parameters

Ask for each parameter one at a time. For each one:
- State the parameter name clearly
- Provide a brief description of what it represents
- Give an example value so the user knows the expected format

For **DayBasis**: accept integer 0, 1, 2, or 3. Explain the meaning of each value:
- 0 = 30/360
- 1 = Actual/Actual
- 2 = Actual/360
- 3 = Actual/365

For **date parameters** (ValuationDate, IssueDate, MaturityDate, LastCouponPaymentDate): accept natural language like "June 30, 2025" or "2025-06-30".

For **CouponFrequency**: accept "Annually", "Semi-annually", or "Quarterly". This is a variable (not a template placeholder) that controls the month increment used in coupon date formulas:
- "Annually" → 12 months
- "Semi-annually" → 6 months
- "Quarterly" → 3 months

For **percentage parameters** (InterestRate, RiskFreeRate, DiscountRate, Volatility, DividendYield): accept percentage notation (e.g. "2.5%", "4%") and convert to decimal (0.025, 0.04) for the replacement value.

For **DilutionEffect**: accept 0 or 1 only. Explain that 1 means dilution is considered, 0 means it is not.

For **optional parameters** (CallStartDate, CallEndDate, PutStartDate, PutEndDate, CallPrice, PutPrice): after collecting all required parameters (#1–#16), ask the user **in a single question** whether Call and Put provisions are applicable for this bond. If the user says they are not applicable, replace all six placeholders with empty strings. If applicable, collect all six values (CallStartDate, CallEndDate, CallPrice, PutStartDate, PutEndDate, PutPrice) as date/number values following the same format rules as required parameters.

### Step 2: Prepare Replacement Values

Before invoking the xlsx skill, prepare the replacement map:

- **Date fields** → convert to Excel DATE formula: `=DATE(year, month, day)`
  - Example: "June 30, 2025" becomes `=DATE(2025,6,30)`
  - Example: "Dec 31, 2030" becomes `=DATE(2030,12,31)`

- **Number fields** → use the numeric value as-is

- **Text fields** → use the string value as-is

Build a complete replacement map. For percentage fields, write the decimal value and apply percentage number format (`0.0%`) so Excel displays them correctly. Search ALL sheets for each placeholder — some appear in multiple sheets:
```
{{DayBasis}}            → 0, 1, 2, or 3 (integer as-is)
{{ValuationDate}}       → =DATE(year,month,day)
{{IssueDate}}           → =DATE(year,month,day)
{{Principal}}           → <number>
{{ConversionPrice}}     → <number>
{{MaturityDate}}        → =DATE(year,month,day)
{{InterestRate}}        → <decimal> with cell format 0.0%
{{CurrencyUnit}}        → <text>
{{RiskFreeRate}}        → <decimal> with cell format 0.0%
{{DiscountRate}}        → <decimal> with cell format 0.0%
{{SportPrice}}           → <number>
{{Volatility}}          → <decimal> with cell format 0.0%
{{DividendYield}}       → <decimal> with cell format 0.0%
{{LastCouponPaymentDate}} → =DATE(year,month,day)
{{DilutionEffect}}      → 0 or 1
{{CallStartDate}}       → =DATE(year,month,day) or empty (if not applicable)
{{CallEndDate}}         → =DATE(year,month,day) or empty (if not applicable)
{{PutStartDate}}        → =DATE(year,month,day) or empty (if not applicable)
{{PutEndDate}}          → =DATE(year,month,day) or empty (if not applicable)
{{CallPrice}}           → <number> or empty (if not applicable)
{{PutPrice}}            → <number> or empty (if not applicable)
```

### Step 3: Prepare Formulas

In the `Input` sheet, auto-generate coupon date and amount columns starting from row 6.

**References:**
- H5 = `LastCouponPaymentDate` (starting point, already filled by placeholder replacement)
- MaturityDate is already filled by placeholder replacement

#### Column H — Coupon Payment Dates (starting from H6)

**Formula rule:**
- H6: `=EDATE(H5, N)`
- H7: `=EDATE(H6, N)`
- ...and so on
- N = CouponFrequency months (Annually → 12, Semi-annually → 6, Quarterly → 3)

**Stop condition:** Only fill rows where the resulting date is **less than or equal to** MaturityDate. Do not generate the next row if it would exceed MaturityDate.

#### Column I — Coupon Payment Amounts (starting from I6)

For each row that has a date in column H, generate the corresponding coupon amount formula:

- Formula pattern: `=$C$30*$C$26*YEARFRAC(H{row-1}, H{row}, $C$27)`
  - I6: `=$C$30*$C$26*YEARFRAC(H5, H6, $C$27)`
  - I7: `=$C$30*$C$26*YEARFRAC(H6, H7, $C$27)`
  - ...and so on

Where:
- `$C$30*$C$26` is the fixed multiplier (does not change across rows)
- YEARFRAC first param = the cell diagonally up-left (H{row-1})
- YEARFRAC second param = the cell to the left (H{row})
- YEARFRAC third param = always `$C$27` (DayBasis reference)

**Example (Semi-annually, N=6):** LastCouponPaymentDate = Dec 15, 2024, MaturityDate = Dec 31, 2030

| Row | Column H (Date) | Column I (Coupon Amount) |
|-----|-----------------|--------------------------|
| 6 | `=EDATE(H5, 6)` → Jun 15, 2025 | `=$C$30*$C$26*YEARFRAC(H5, H6, $C$27)` |
| 7 | `=EDATE(H6, 6)` → Dec 15, 2025 | `=$C$30*$C$26*YEARFRAC(H6, H7, $C$27)` |
| 8 | `=EDATE(H7, 6)` → Jun 15, 2026 | `=$C$30*$C$26*YEARFRAC(H7, H8, $C$27)` |
| ... | ... (+ 6 months each row) | ... |
| last | `=EDATE(H{prev}, 6)` → Dec 15, 2030 | `=$C$30*$C$26*YEARFRAC(H{prev}, H{last}, $C$27)` |

### Step 4: Generate Report

Invoke the `xlsx` skill to:
1. Copy `template/CB_template.xlsx` to `reports/CB_report_<ValuationDate>.xlsx` (use the date in YYYYMMDD format for the filename)
2. Scan only `Input` sheet for `{{Placeholder}}` values and replace every occurrence with the corresponding prepared value from Step 2
3. Apply percentage cell format (`0.0%`) to all percentage fields
4. Fill formulas in the `Input` sheet as defined in Step 3 (Column H coupon dates and Column I coupon amounts)
5. Save the file

### Step 5: Confirm

Check if all workflow are satisfied. Report the generated file path to the user and confirm all parameters were applied correctly.

## Important Notes

- Date values must be Excel DATE formulas, not plain text, so that downstream date calculations work correctly.
