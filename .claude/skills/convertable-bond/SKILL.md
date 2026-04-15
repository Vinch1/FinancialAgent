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
- Some placeholders (e.g. `{{SportPrice}}`, `{{Volatility}}`, `{{DividendYield}}`, etc.) may appear in multiple sheets. Replace ALL occurrences across the entire workbook.

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
| 13 | SportPrice | `{{SportPrice}}` | Number | 45.00 |
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
{{SportPrice}}           → <number>
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
5. Auto-generate coupon payment dates in B17 and below, and corresponding coupon amounts in C17 and below in the `Input` sheet (see Auto-generated Coupon Rows below)

### Auto-generated Coupon Rows (Input sheet, B17:C17 onwards)

After all `{{Placeholder}}` values are replaced, rows 17 and below in columns B and C of the `Input` sheet must be auto-generated.

**References:**
- B16 = `FirstDateToPay` (starting point, already filled by placeholder replacement)
- B8 = `MaturityDate` (cap, already filled by placeholder replacement)

#### Column B — Coupon Payment Dates

**Formula rule for each cell:**
- Each cell = previous cell + 12 months, capped at MaturityDate
- Formula pattern: `=IF(EDATE(B{prev_row}, 12) > C$8, C$8, EDATE(B{prev_row}, 12))`
  - B17: `=IF(EDATE(B16, 12) > C$8, C$8, EDATE(B16, 12))`
  - B18: `=IF(EDATE(B17, 12) > C$8, C$8, EDATE(B17, 12))`
  - ...and so on

**Stop condition:** Do not generate the next row if the current cell already equals B8 (maturity date). The last generated cell must always equal B8 (maturity date).

#### Column C — Coupon Payment Amounts

For each row that has a date in column B, generate the corresponding coupon amount formula:

- Formula pattern: `=C$4*$C$10*YEARFRAC(B{current_row}, B{prev_row}, 3)`
  - C17: `=C$4*$C$10*YEARFRAC(B17, B16, 3)`
  - C18: `=C$4*$C$10*YEARFRAC(B18, B17, 3)`
  - ...and so on

The YEARFRAC calculates the year fraction between the current and previous coupon dates using day count basis 3 (Actual/365).

**Example:** FirstDateToPay = Jun 15, 2025, MaturityDate = Dec 31, 2030
| Row | Column B (Date) | Column C (Coupon Amount) |
|-----|-----------------|--------------------------|
| 17 | Jun 15, 2026 | `=C$4*$C$10*YEARFRAC(B17,B16,3)` |
| 18 | Jun 15, 2027 | `=C$4*$C$10*YEARFRAC(B18,B17,3)` |
| 19 | Jun 15, 2028 | `=C$4*$C$10*YEARFRAC(B19,B18,3)` |
| 20 | Jun 15, 2029 | `=C$4*$C$10*YEARFRAC(B20,B19,3)` |
| 21 | Jun 15, 2030 | `=C$4*$C$10*YEARFRAC(B21,B20,3)` |
| 22 | Dec 31, 2030 (capped → stop) | `=C$4*$C$10*YEARFRAC(B22,B21,3)` |

#### Full CB sheet — Transpose Coupon Dates and Amounts

After generating the coupon date rows in the `Input` sheet, set the following cells in the `Full CB` sheet:

- **Cell I2**: `=TRANSPOSE(Input!B16:B{last_row})` — transposes coupon payment dates
- **Cell I5**: `=TRANSPOSE(Input!C16:C{last_row})` — transposes coupon payment amounts

**IMPORTANT:** These TRANSPOSE formulas must be written as **array formulas** (CSE / Ctrl+Shift+Enter style). Do NOT write them as regular formulas — Excel will add `@` implicit intersection operators and break the output. In openpyxl, use `Worksheet.array_formula` or set the cell's `value` with proper array formula syntax (wrapped in `{}`) to avoid the `@` prefix.

`{last_row}` is the last auto-generated row number from the coupon rows above.

Example: if the last auto-generated row is 22:
- I2: `=TRANSPOSE(Input!B16:B22)`
- I5: `=TRANSPOSE(Input!C16:C22)`

#### Straight Debt sheet — Cash Flow Table (B14:F{last_row} onwards)

The `Straight Debt` sheet has a table with headers in B13:F13. Starting from row 14, fill one row for each auto-generated coupon date from the `Input` sheet (B16 to B{last_row}).

There are `{last_row} - 16 + 1` rows in total (e.g., if last_row = 22, there are 7 rows: rows 14–20).

For each row `r` (starting at 14), where `input_row = r - 14 + 16`:

| Column | Header | Formula |
|--------|--------|---------|
| B | Date | `=Input!B{input_row}` |
| C | Interest Payment | `=IF(B{r}<C$3, "", Input!C{input_row})` |
| D | Principal Repayment | Empty for all rows except the **last row**: `=Input!C4` |
| E | TTM | `=IF(B{r}<C$3, 0, YEARFRAC(B{r}, C$3, 3))` |
| F | PV | `=SUM(C{r}:D{r})/(1+C$10)^E{r}` |

**Note:** C$3 and C$10 refer to cells in the `Straight Debt` sheet (not the Input sheet). C3 is typically the valuation date reference, and C10 is the discount rate.

**Example:** If auto-generated rows go from B16 to B22 (7 coupon dates), the Straight Debt table is rows 14–20:
| Row | B (Date) | C (Interest) | D (Principal) | E (TTM) | F (PV) |
|-----|----------|-------------|--------------|---------|--------|
| 14 | `=Input!B16` | `=IF(B14<C$3,"",Input!C16)` | *(empty)* | `=IF(B14<C$3,0,YEARFRAC(B14,C$3,3))` | `=SUM(C14:D14)/(1+C$10)^E14` |
| 15 | `=Input!B17` | `=IF(B15<C$3,"",Input!C17)` | *(empty)* | `=IF(B15<C$3,0,YEARFRAC(B15,C$3,3))` | `=SUM(C15:D15)/(1+C$10)^E15` |
| ... | ... | ... | ... | ... | ... |
| 20 | `=Input!B22` | `=IF(B20<C$3,"",Input!C22)` | `=Input!C4` | `=IF(B20<C$3,0,YEARFRAC(B20,C$3,3))` | `=SUM(C20:D20)/(1+C$10)^E20` |

#### Straight Debt sheet — Total PV Row

After the last data row, add a summary row (`last_table_row + 1`):

| Column | Value |
|--------|-------|
| B | `Total PV` |
| C | *(empty)* |
| D | *(empty)* |
| E | *(empty)* |
| F | `=ROUND(SUM(F14:F{last_table_row}), -4)` |

**Example:** If the table data is rows 14–20, the Total PV row is row 21:
- B21: `Total PV`
- F21: `=ROUND(SUM(F14:F20), -4)`

### Step 4: Confirm

Report the generated file path to the user and confirm all parameters were applied correctly.

## Important Notes

- Date values must be Excel DATE formulas, not plain text, so that downstream date calculations work correctly.
