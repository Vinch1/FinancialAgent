---
name: per-option-value
description: Generate ESO (Employee Stock Option) valuation reports. Use this skill when the user needs to value employee stock options, calculate per-option values, or generate ESO valuation reports.
---

# Per-Option Value Calculator (John Hull ESO Model)

This skill calculates the fair value of employee stock options using the Enhanced FASB 123 trinomial tree methodology developed by John Hull, then generates a valuation report.

## Workflow

1. Collect all required information from the user
2. Calculate derived parameters from dates
3. Run the per-option value calculation
4. Generate the Excel report using the xlsx skill
5. Ask user if they want to generate a DOCX report (optional)
6. If yes, collect DOCX-specific information and generate using minimax-docx skill

## Step 1: Collect Information from User

Collect parameters **one by one** in a conversational manner. Ask for one parameter, wait for the user's response, then ask for the next one. Do not present all questions at once.

**Asking order:**
- Client Name
- Valuation Subject
- Valuation Date
- Currency Unit (e.g., USD, HKD)
- Grant Date of the Subject
- Maturity Date
- Exercise Price
- Report Recipient (Employee / Director / Both)
- **Multi-batch Check** (only if Report Recipient is Employee or Director):
  - Ask: "Are there multiple Vesting Dates (batches) for this report? (yes/no)"
  - If **yes** (multi-batch scenario):
    - Ask for each batch's Vesting Date and No. of Share Options (loop until all batches are collected)
    - Example: "Please provide the Vesting Date and No. of Share Options for Batch 1." → Wait for response → "Is there another batch? (yes/no)" → Continue until all batches are collected
    - **Note:** Multi-batch is NOT available for "Both" recipient type
  - If **no** (single-batch scenario):
    - Ask for single Vesting Date
    - Ask for Total No. of Share Options
- **If Report Recipient is "Both"** (single-batch only):
  - Ask for single Vesting Date
  - Ask for Total No. of Share Options to Employees / Directors (ask for both values separately)
- Spot Price (`--S`)
- Strike Price (`--K`)
- Volatility (`--V`) - Annual volatility (decimal)
- Risk-free Rate (`--R`) - Annual risk-free rate (decimal)
- Dividend Yield (`--Q`) - Annual dividend yield (decimal)
- Post-vest Exit Rate (`--postVest`) - Annual exit rate after vesting
  - For "Both" recipient: ask for both Employee and Director values separately
  - For multi-batch: ask once (same value applies to all batches)
- Exercise Multiple (`--exMult`) - Ask the user: "Would you like to use the default Exercise Multiple? (Default: 2.2 for Employee, 2.8 for Director)"
    - If yes: Use the default based on Report Recipient
    - If no: Ask for the custom Exercise Multiple value
    - For "Both" recipient: Ask for custom values for both Employee and Director

**Date Format:** Use format "12 Dec 2023" (day month year) for all dates.

**Default Values (do not ask):**
- Pre-vest Exit Rate (`--preVest`): 0.0

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
- If user confirmed default Exercise Multiple:
  1. First run: Exercise Multiple = 2.2 (Employee calculation)
  2. Second run: Exercise Multiple = 2.8 (Director calculation)
- If user specified custom Exercise Multiple values:
  1. First run: Use the Employee custom Exercise Multiple value
  2. Second run: Use the Director custom Exercise Multiple value

Keep both calculation results - you will pass them to the xlsx skill together so the report contains both values.

**Important - Multi-batch Handling:**
If there are multiple Vesting Dates (batches), you must run the calculation script **once per batch**:
- Each batch has its own Time to Vest (`--vestTime`)
- Each batch gets its own PerOptionValue result
- All batches use the same Post-vest Exit Rate and other parameters (except vestTime)

### Summary Table: Calculation Runs

| Scenario | Calculation Runs | Template |
|----------|------------------|----------|
| Single recipient, single batch | 1 run | ESO template.xlsx |
| Single recipient, multi-batch | N runs (N = number of batches) | ESO multi-batch.xlsx |
| "Both" recipient | 2 runs (Employee + Director) | ESO template.xlsx |

## Step 2: Calculate Derived Parameters

Calculate these values by running the year fraction script from the dates provided:

| Derived Parameter | Calculation |
|-------------------|-------------|
| Time to Maturity (`--T`) | Valuation Date - Maturity Date|
| Time to Vest (`--vestTime`) | Vesting Date - Grant Date of the Subject|

**For Time to Vest calculation, use the Python script:**

**Important:** For `uv run` commands, first `cd` to `.claude/skills/per-option-value/`, run the script, then `cd -` back to project root. All other commands (bun, dotnet, cp) run from project root.

Example commands for single batch:
```bash
cd .claude/skills/per-option-value/ && uv run python scripts/calc_yearfrac.py --startdate "01 Nov 2024" --enddate "01 Jul 2027" && cd -
```

**For multi-batch:** Run the script for each Vesting Date to get each batch's Time to Vest.

Show the user the calculated values before proceeding.

## Step 3: Run the Calculation to get PerOptionValue

The script is bundled with this skill. Run from the **project root directory** with full path:
```bash
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts [options]
```

### Example Usage (Single Batch)

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

### Example Usage (Multi-batch)

For each batch, run the calculation with the batch's specific `--vestTime`:

```bash
# Batch 1
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts \
  --S 50.0 \
  --K 45.0 \
  --T 5.0 \
  --V 0.35 \
  --R 0.04 \
  --Q 0.02 \
  --exMult 2.2 \
  --preVest 0.0 \
  --postVest 0.08 \
  --vestTime 1.0

# Batch 2
bun .claude/skills/per-option-value/scripts/JohnHullESO.ts \
  --S 50.0 \
  --K 45.0 \
  --T 5.0 \
  --V 0.35 \
  --R 0.04 \
  --Q 0.02 \
  --exMult 2.2 \
  --preVest 0.0 \
  --postVest 0.08 \
  --vestTime 2.0
```

## Step 4: Generate the Report

After the calculation completes, replace the placeholder values in the excel report template with all collected and calculated data. A placeholder looks like this: `{{Valuation Date}}`, `{{Time to Vest1}}`, `{{Maturity Date}}`, etc.

### Excel Template Selection

| Scenario | Template Location |
|----------|-------------------|
| Single batch (Employee/Director) | `.claude/skills/per-option-value/template/ESO template.xlsx` |
| "Both" recipient | `.claude/skills/per-option-value/template/ESO template.xlsx` |
| Multi-batch | `.claude/skills/per-option-value/template/ESO multi-batch.xlsx` |

### Dynamic Column Handling for Multi-batch Reports

The multi-batch template has a base structure with columns for a fixed number of batches. You must dynamically adjust the columns based on the actual number of batches:

**Step 1: Determine the base number of batch columns in the template**
- Open the template and identify how many batch columns exist (e.g., if E14~E19 contains Batch 3 placeholders, the template has 3 batch columns)

**Step 2: Compare with actual batch count and adjust**

| Condition | Action |
|-----------|--------|
| Actual batches < Template columns | **Delete unused columns** - Remove the excess batch columns (e.g., if 2 batches but template has 3 columns, delete the 3rd batch column) |
| Actual batches = Template columns | No adjustment needed - Proceed with placeholder replacement |
| Actual batches > Template columns | **Add new columns** - Copy the structure of the last batch column and insert new columns for additional batches |

**Step 3: Column manipulation instructions for xlsx skill**

When invoking the xlsx skill for multi-batch reports, explicitly instruct it to:

1. **For deleting columns:** Specify which columns to remove (e.g., "Delete column E which contains Batch 3 placeholders")
2. **For adding columns:** Specify to copy the last batch column's structure and insert it N times, then update placeholders accordingly

**Example instruction to xlsx skill:**
```
This is a multi-batch report with 3 batches. The template has 2 batch columns.
Please:
1. Copy Entire column D (Batch 2) structure, including **cell background color** 
2. Insert a new column after column D for Batch 3
3. Update placeholders: {{Time to Vest2}} → {{Time to Vest3}}, {{No. of Share Options2}} → {{No. of Share Options3}}, "=D27/D17" → "=E27/E17", etc.
4. Fill all placeholders with the batch data provided
```

**Note:** When adding a new column, make sure also to copy the cell's background color.

Invoke the **xlsx** skill from the project root and pass ALL of the following data explicitly:

**Report Information:**
- Client Name
- Valuation Subject
- Valuation Date
- Currency Unit
- Grant Date of the Subject
- Maturity Date
- Exercise Price
- Vesting Date (single) OR List of Vesting Dates (multi-batch)
- Report Recipient (Employee / Director / Both)

**Calculation Parameters:**
- Spot Price
- Strike Price (same as Exercise Price)
- Time to Maturity
- Volatility
- Risk-free Rate
- Dividend Yield
- Exercise Multiple (Custom or default based on recipient)
- Pre-vest Exit Rate
- Time to Vest (single) OR List of Time to Vest values (multi-batch)
- Post-vest Exit Rate

**No. of Share Options:**
- Single batch: Total No. of Share Options
- Multi-batch: List of No. of Share Options per batch
- "Both" recipient: Total No. of Share Options to Employees AND Total No. of Share Options to Directors

**Calculated Results:**
- Single recipient, single batch: PerOptionValue
- Single recipient, multi-batch: List of PerOptionValue per batch
- "Both" recipient:
  - PerOptionValue_Employee: [result from Employee exMult run]
  - PerOptionValue_Director: [result from Director exMult run]

The xlsx skill needs all these values to replace the placeholder values correctly.
Report filename should follow the format: `ESO_Valuation_Report_[ClientName]_[TimeStamp].xlsx`
Save the completed report to ".claude/skills/per-option-value/reports/" and provide the file path to the user.

## Step 5: Ask User About DOCX Report

After the Excel report is generated and saved, ask the user:

> "The Excel report has been generated successfully. Would you like to generate a formal DOCX valuation report as well? (yes/no)"

- If the user says **no** or declines: End the workflow here. The task is complete.
- If the user says **yes** or agrees: Proceed to Step 6 to collect additional information.

## Step 6: Collect DOCX Report Information

Collect the following additional information **one by one** in a conversational manner. Ask for one parameter, wait for the user's response, then ask for the next one. Do not present all questions at once.

**Asking order:**

1. **Client Company Name** - The full legal name of the client company
2. **Company Profile** - Automatically fetch company profile from HKEX
   - Run the following script (cd to skill folder first, then cd back):
   ```bash
   cd .claude/skills/per-option-value/ && uv run python scripts/hkex_crawler_scrapling.py --name "Client Company Name" && cd -
   ```
   - Replace `"Client Company Name"` with the actual company name collected in step 1
   - If the script fails or returns no result, ask the user to provide the company profile manually
3. **Reference Number** - the reference number for this valuation engagement
4. **use HKAS or IAS** - The Hong Kong/International Accounting Standard reference (e.g., "HKAS", "IAS")
5. **use HKFRS or IFRS** - The Hong Kong/International Financial Reporting Standard reference (e.g., "HKFRS", "IFRS")
6. **Client Address** - The client's registered address
   - **Important:** Inform the user: "Please use ',' to separate different parts of the address (e.g., 'Room 1001, 10/F, Tower A, ABC Building, 123 Queen's Road, Hong Kong')"
   - **Note:** When building the mapping.json, replace all ',' with '\n' in the ClientAddress value so each part displays on its own line in the DOCX (e.g., "Room 1001, 10/F, Tower A" → "Room 1001\n10/F\nTower A")

**Pre-filled Data from Previous Steps:**

The following data is already collected in Step 1 and should be passed directly to the DOCX report:
- Client Name (from Step 1)
- Valuation Subject
- Valuation Date
- Currency Unit
- Total No. of Share Options (from Step 1, or sum of all batches for multi-batch)
- Grant Date of the Subject
- Maturity Date
- Exercise Price
- Exercise Multiple (Custom or default based on recipient)
- Vesting Date(s) (single or multi-batch)
- Spot Price, Strike Price, Volatility, Risk-free Rate, Dividend Yield
- Time to Maturity, Time to Vest(s)
- Per-Option Value(s) from calculation

**Compute Data**

For single recipient (Employee or Director):
- TotalOptionValue = PerOptionValue × Total No. of Share Options

For multi-batch:
- TotalOptionValue_batch = one PerOptionValue_batch × one No. of Share Options_batch
- TotalOptionValue = Sum of (TotalOptionValue_batch) for all batches

For "Both" recipient:
- TotalOptionValueEmployee = PerOptionValue_Employee × Total No. of Share Options to Employees
- TotalOptionValueDirector = PerOptionValue_Director × Total No. of Share Options to Directors
- TotalOptionValue = TotalOptionValueEmployee + TotalOptionValueDirector
- TotalNoOfShareOptions = Total No. of Share Options to Employees + Total No. of Share Options to Directors

**Conditional Variables**

| Variable | Condition | Value |
|----------|-----------|-------|
| ExerciseMultipleSource | Exercise Multiple is default (user confirmed default) | `"Accounting for Employee Stock Options" by John Hull and Alan White` |
| ExerciseMultipleSource | Exercise Multiple is custom (user provided value) | `Management` |
| ExerciseMultipleNote | Exercise Multiple is default (user confirmed default) | `Average ratio of top executives/employees` |
| ExerciseMultipleNote | Exercise Multiple is custom (user provided value) | `Historical exercise behaviour of top executives/employees` |
| HKAS_IAS_Desc | HKAS_IAS is "HKAS" | `Hong Kong Accounting Standard(s)` |
| HKAS_IAS_Desc | HKAS_IAS is not "HKAS" (e.g., "IAS") | `International Valuation Standard(s)` |
| HKFRS_IFRS_Desc | HKFRS_IFRS is "HKFRS" | `Hong Kong Financial Reporting Standard(s)` |
| HKFRS_IFRS_Desc | HKFRS_IFRS is not "HKFRS" (e.g., "IFRS") | `International Financial Reporting Standard(s)` |
| CurrencyUnitDesc | CurrencyUnit is "HKD" | `Hong Kong Dollars` |
| CurrencyUnitDesc | CurrencyUnit is "RMB" or "CNY" | `Renminbi` |
| CurrencyUnitDesc | CurrencyUnit is "USD" | `United States Dollar` |

## Step 7: Generate the DOCX Report

Invoke the **minimax-docx** skill to generate the DOCX report.

### Template Selection

| Scenario | Template Location |
|----------|-------------------|
| Single batch (Employee/Director) | `.claude/skills/per-option-value/template/ESO_Report Template_v2.docx` |
| "Both" recipient | `.claude/skills/per-option-value/template/ESO_Report Template_v2.docx` |
| Multi-batch (Employee or Director only) | `.claude/skills/per-option-value/template/ESO_Report multi-batch.docx` |

If the template does not exist, inform the user and ask if they would like to proceed by creating a new document from scratch using the minimax-docx skill.

---

### Workflow A: Single Batch / "Both" Recipient

For single batch or "Both" recipient reports, use `fill-placeholders` directly on the template:

```bash
dotnet run --project .claude/skills/minimax-docx/scripts/dotnet/MiniMaxAIDocx.Cli -- \
  edit fill-placeholders \
  --input ".claude/skills/per-option-value/template/ESO_Report Template_v2.docx" \
  --output ".claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx" \
  --mapping ./mapping.json
```

**Workflow A Summary:**
```
Template → fill-placeholders (replace all {{...}}) → Final report
```

---

### Workflow B: Multi-batch (Employee or Director Only)

For multi-batch reports, the DOCX template contains an empty table in Section 10 (OPINION OF VALUE) that must be filled with batch data **before** running `fill-placeholders`.

**Workflow B Summary:**
```
Copy template → fill-table (add data rows) → fill-placeholders (replace all {{...}}) → Final report
```

#### Step B1: Copy Template to Output Location

```bash
cp ".claude/skills/per-option-value/template/ESO_Report multi-batch.docx" \
   ".claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx"
```

#### Step B2: Fill the Table

The table in Section 10 has the following structure:

| Valuation Date | Vesting Date | Per Option Value | Total Option Value |
|----------------|--------------|------------------|-------------------|
| {{ValuationDate}} | VestingDate_1 | PerOptionValue_1 | TotalOptionValue_1 |
| {{ValuationDate}} | VestingDate_2 | PerOptionValue_2 | TotalOptionValue_2 |
| ... | ... | ... | ... |
| Total | | | {{TotalOptionValue}} |

Generate a CSV file (e.g., `table_data.csv`) with header and the batch data to fill this table.

**Row Details:**
- Row 1: Header row (Valuation Date, Vesting Date, Per Option Value, Total Option Value)
- Row 2 to N: Each batch's data row
  - Column 1: `{{ValuationDate}}` (same for all rows, will be replaced by fill-placeholders later)
  - Column 2: The batch's Vesting Date
  - Column 3: The batch's Per Option Value (from calculation)
  - Column 4: The batch's Total Option Value (PerOptionValue × NoOfShareOptions for that batch)
- Last row: `["Total", "", "", "{{TotalOptionValue}}"]`

**Fill Table Command:**
usually the table index of the target table in the DOCX template is 5, then `--table-index 5`, then run:
```bash
dotnet run --project .claude/skills/minimax-docx/scripts/dotnet/MiniMaxAIDocx.Cli -- \
  edit fill-table \
  --input ".claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx" \
  --output ".claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx" \
  --table-index 5 \
  --csv table_data.csv
```

#### Step B3: Fill Remaining Placeholders

After filling the table, run `fill-placeholders` on the same output file:

```bash
dotnet run --project .claude/skills/minimax-docx/scripts/dotnet/MiniMaxAIDocx.Cli -- \
  edit fill-placeholders \
  --input ".claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx" \
  --output ".claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx" \
  --mapping ./mapping.json
```

**Important Notes for Multi-batch Table:**
- The Valuation Date column uses `{{ValuationDate}}` placeholder so it gets replaced in the fill-placeholders step
- The Total row's Total Option Value uses `{{TotalOptionValue}}` placeholder so it gets replaced in the fill-placeholders step
- All currency formatting (e.g., "HKD") should be applied in the fill-placeholders step, not in the table data

---

### Placeholder Mapping

JSON structure:

```json
{
  "ClientCompanyName": "[from Step 6]",
  "CompanyProfile": "[from Step 6 - fetched via hkex_crawler_scrapling.py]",
  "ReferenceNumber": "[from Step 6]",
  "HKAS_IAS": "[from Step 6]",
  "HKFRS_IFRS": "[from Step 6]",
  "ClientAddress": "[from Step 6 - replace ',' with '\\n' for line breaks]",
  "ClientName": "[from Step 1]",
  "ValuationSubject": "[from Step 1]",
  "ValuationDate": "[from Step 1]",
  "TotalNoOfShareOptionstoEmployees": "[from Step 1]",
  "TotalNoOfShareOptionstoDirectors": "[from Step 1]",
  "ExerciseMultipleforEmployee": "[from Step 1 or default] if not applicable, set to ' '",
  "ExerciseMultipleforDirector": "[from Step 1 or default] if not applicable, set to ' '",
  "Post-vestingExitRateEmployee": "[from Step 1 or default, format as 'x.x for Employee'] if not applicable, set to ' '",
  "Post-vestingExitRateDirector": "[from Step 1 or default, format as 'x.x for Director'] if not applicable, set to ' '",
  "CurrencyUnit": "[from Step 1]",
  "GrantDate": "[from Step 1]",
  "MaturityDate": "[from Step 1]",
  "ExercisePrice": "[from Step 1]",
  "VestingDate": "[from Step 1 - single date, or comma-separated for multi-batch]",
  "SpotPrice": "[from Step 1]",
  "StrikePrice": "[from Step 1]",
  "Volatility": "[from Step 1]",
  "RiskFreeRate": "[from Step 1]",
  "DividendYield": "[from Step 1]",
  "TimeToMaturity": "[from Step 2]",
  "TimeToVest": "[from Step 2 - single value, or comma-separated for multi-batch]",
  "PerOptionValue_Employee": "[from Step 3, if applicable - single or comma-separated for multi-batch]",
  "PerOptionValue_Director": "[from Step 3, if applicable - single or comma-separated for multi-batch]",
  "DateOfReport": "[Date of Report]",
  "TotalOptionValueEmployee": "[computed value]",
  "TotalOptionValueDirector": "[computed value]",
  "TotalOptionValue": "[computed value]",
  "TotalNoOfShareOptions": "[computed value]",
  "ExerciseMultipleSource": "[conditional based on default/custom Exercise Multiple]",
  "ExerciseMultipleNote": "[conditional based on default/custom Exercise Multiple]",
  "HKAS_IAS_Desc": "[conditional based on HKAS_IAS value]",
  "HKFRS_IFRS_Desc": "[conditional based on HKFRS_IFRS value]",
  "CurrencyUnitDesc": "[conditional based on CurrencyUnit value]"
}
```

**Multi-batch Placeholder Handling:**

For multi-batch reports, certain placeholders can contain multiple values. Format them as follows:

| Placeholder | Single Batch Format | Multi-batch Format |
|-------------|---------------------|-------------------|
| VestingDate | `"01 Jan 2025"` | `"01 Jan 2025, 01 Jan 2026, 01 Jan 2027"` |
| TimeToVest | `"2.0"` | `"1.0, 2.0, 3.0"` |
| PerOptionValue_Employee | `"12.3456"` | `"12.3456, 11.2345, 10.1234"` |
| PerOptionValue_Director | `"15.6789"` | `"15.6789, 14.5678, 13.4567"` |


Create a temporary mapping.json file first and always use dotnet CLI to run the minimax-docx skill. Use the `fill-placeholders` command with '--mapping' mapping.json file. Forbit using Python.

**CLI Command Example:**

```bash
dotnet run --project .claude/skills/minimax-docx/scripts/dotnet/MiniMaxAIDocx.Cli -- \
  edit fill-placeholders \
  --input ".claude/skills/per-option-value/template/ESO_Report Template_v2.docx" \
  --output ".claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx" \
  --mapping ./mapping.json
```

**Report filename should follow the format:** `ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx`

Inform user once the DOCX report is generated and saved.
