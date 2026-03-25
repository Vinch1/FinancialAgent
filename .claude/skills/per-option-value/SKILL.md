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
1. Client Name
2. Valuation Subject
3. Valuation Date
4. Currency Unit (e.g., USD, HKD)
5. Grant Date of the Subject
6. Maturity Date
7. Exercise Price
8. Vesting Date
9. Report Recipient (Employee / Director / Both)
10. Total No. of Share Options to Employees / Directors (for "Both" recipient, ask for both values separately)
11. Spot Price (`--S`)
12. Strike Price (`--K`)
13. Volatility (`--V`) - Annual volatility (decimal)
14. Risk-free Rate (`--R`) - Annual risk-free rate (decimal)
15. Dividend Yield (`--Q`) - Annual dividend yield (decimal)
16. Post-vest Exit Rate (`--postVest`) - Annual exit rate after vesting (for "Both" recipient, ask for both values separately)
17. Exercise Multiple (`--exMult`) - Ask the user: "Would you like to use the default Exercise Multiple? (Default: 2.2 for Employee, 2.8 for Director)"
    - If yes: Use the default based on Report Recipient
    - If no: Ask for the custom Exercise Multiple value for both Employee and Director.

**Date Format:** Use format "12 December 2023" (day month year) for all dates.

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

## Step 2: Calculate Derived Parameters

Calculate these values from the dates provided:

| Derived Parameter | Calculation |
|-------------------|-------------|
| Time to Maturity (`--T`) | Maturity Date - Valuation Date (in years) |
| Time to Vest (`--vestTime`) | Vesting Date - Grant Date of the Subject (in years) |

Show the user the calculated values before proceeding.

## Step 3: Run the Calculation to get PerOptionValue

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

After the calculation completes, replace the placeholder values in the excel report template with all collected and calculated data.
a placeholder look like this: `{{Valuation Date}}`, `{{Currency Unit}}`, `{{Maturity Date}}`, etc.

Invoke the **xlsx** skill from the project root and pass ALL of the following data explicitly:

**Template Location:** `.claude/skills/template/ESO template.xlsx`

**Report Information:**
- Client Name
- Valuation Subject
- Valuation Date
- Currency Unit
- Grant Date of the Subject
- Maturity Date
- Exercise Price
- Vesting Date
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
- Time to Vest
- Post-vest Exit Rate for Employee / Director (if "Both" recipient)

**Derived Values:**
- Time to Maturity (years)
- Time to Vest (years)

**Calculated Results:**
- If Employee: PerOptionValue from Employee exMult run
- If Director: PerOptionValue from Director exMult run
- If Both:
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
2. **Reference Number** - The reference number for this valuation engagement
3. **use HKAS or IAS** - The Hong Kong/International Accounting Standard reference (e.g., "HKAS 2", "IAS 19")
4. **use HKFRS or IFRS** - The Hong Kong/International Financial Reporting Standard reference (e.g., "HKFRS 2", "IFRS 2")
5. **Client Address** - The client's registered address
   - **Important:** Inform the user: "Please use ',' to separate different parts of the address (e.g., 'Room 1001, 10/F, Tower A, ABC Building, 123 Queen's Road, Hong Kong')"

**Pre-filled Data from Previous Steps:**

The following data is already collected in Step 1 and should be passed directly to the DOCX report:
- Client Name (from Step 1)
- Valuation Subject
- Valuation Date
- Currency Unit
- Total No. of Share Options to Employees / Directors (from Step 1)
- Grant Date of the Subject
- Maturity Date
- Exercise Price
- Exercise Multiple (Custom or default based on recipient)
- Vesting Date
- Spot Price, Strike Price, Volatility, Risk-free Rate, Dividend Yield
- Time to Maturity, Time to Vest
- Per-Option Value(s) from calculation

**Compute Data**
- TotalOptionValueEmployee = PerOptionValue_Employee * Total No. of Share Options to Employees
- TotalOptionValueDirector = PerOptionValue_Director * Total No. of Share Options to Directors
- TotalOptionValue = TotalOptionValueEmployee + TotalOptionValueDirector
- TotalNoOfShareOptions = Total No. of Share Options to Employees + Total No. of Share Options to Directors

## Step 7: Generate the DOCX Report

Invoke the **minimax-docx** skill to generate the DOCX report.

**Template Location:** `.claude/skills/per-option-value/template/ESO_Report Template_v2.docx`

If the template does not exist, inform the user and ask if they would like to proceed by creating a new document from scratch using the minimax-docx skill.

**Placeholder Mapping:**

When using the minimax-docx skill, use the `fill-placeholders` command with the following JSON structure:

```json
{
  "ClientCompanyName": "[from Step 6]",
  "ReferenceNumber": "[from Step 6]",
  "HKAS_IAS": "[from Step 6]",
  "HKFRS_IFRS": "[from Step 6]",
  "ClientAddress": "[from Step 6]",
  "ClientName": "[from Step 1]",
  "ValuationSubject": "[from Step 1]",
  "ValuationDate": "[from Step 1]",
  "TotalNoOfShareOptionstoEmployees": "[from Step 1]",
  "TotalNoOfShareOptionstoDirectors": "[from Step 1]",
  "ExerciseMultipleforEmployee": "[from Step 1 or default]",
  "ExerciseMultipleforDirector": "[from Step 1 or default]",
  "CurrencyUnit": "[from Step 1]",
  "GrantDate": "[from Step 1]",
  "MaturityDate": "[from Step 1]",
  "ExercisePrice": "[from Step 1]",
  "VestingDate": "[from Step 1]",
  "SpotPrice": "[from Step 1]",
  "StrikePrice": "[from Step 1]",
  "Volatility": "[from Step 1]",
  "RiskFreeRate": "[from Step 1]",
  "DividendYield": "[from Step 1]",
  "TimeToMaturity": "[from Step 2]",
  "TimeToVest": "[from Step 2]",
  "PerOptionValue_Employee": "[from Step 3, if applicable]",
  "PerOptionValue_Director": "[from Step 3, if applicable]",
  "DateOfReport": "[Date of Report]",
  "TotalOptionValueEmployee": "[computed value]",
  "TotalOptionValueDirector": "[computed value]",
  "TotalOptionValue": "[computed value]",
  "TotalNoOfShareOptions": "[computed value]"
}
```

**CLI Command Example:**

```bash
dotnet run --project .claude/skills/minimax-docx/scripts/dotnet/MiniMaxAIDocx.Cli -- \
  edit fill-placeholders \
  --input .claude/skills/per-option-value/template/ESO_Valuation_Report_Template.docx \
  --output .claude/skills/per-option-value/reports/ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx \
  --data '{"ClientCompanyName":"...", "ReferenceNumber":"...", ...}'
```

**Report filename should follow the format:** `ESO_Valuation_Report_[ClientCompanyName]_DOCX.docx`

Save the completed DOCX report to ".claude/skills/per-option-value/reports/" and provide the file path to the user.
