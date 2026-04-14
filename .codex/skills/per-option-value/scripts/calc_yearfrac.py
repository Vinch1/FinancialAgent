"""
Calculate year fraction between two dates using ACT/ACT convention.
Equivalent to Excel's YEARFRAC(start_date, end_date, 1).
"""

import argparse
from datetime import datetime
from yearfrac import yearfrac


def calculate_yearfrac(start_date, end_date) -> float:
    """
    Calculate the year fraction between two dates using ACT/ACT AFB convention.

    This matches Excel's YEARFRAC function with basis=1 (ACT/ACT).

    Args:
        start_date: The start date (datetime date object)
        end_date: The end date (datetime date object)

    Returns:
        The year fraction as a float
    """
    result = yearfrac(start_date, end_date)
    return round(result, 3)


def parse_date(date_str: str):
    """Parse a date string in 'DD Mon YYYY' format (e.g., '01 Nov 2024')."""
    return datetime.strptime(date_str, "%d %b %Y").date()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calculate year fraction between two dates (ACT/ACT)")
    parser.add_argument("--startdate", required=True, help='Start date in "DD Mon YYYY" format (e.g., "01 Nov 2024")')
    parser.add_argument("--enddate", required=True, help='End date in "DD Mon YYYY" format (e.g., "01 Nov 2025")')

    args = parser.parse_args()

    start_date = parse_date(args.startdate)
    end_date = parse_date(args.enddate)

    result = calculate_yearfrac(start_date, end_date)
    print(result)
