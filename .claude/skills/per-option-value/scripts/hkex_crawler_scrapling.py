#!/usr/bin/env python3
"""
HKEX Company Profile Crawler (Scrapling Version)

Crawls company profile text from HKEX.com Hong Kong Stock Exchange.
Uses Scrapling for adaptive web scraping with anti-bot bypass.
Uses yfinance for company name to stock code lookup.

Usage:
    # Search by stock code
    uv run python hkex_crawler_scrapling.py --code 82
    uv run python hkex_crawler_scrapling.py --code 82 --output company.json

    # Search by company name
    uv run python hkex_crawler_scrapling.py --name "Crazy Sports"
    uv run python hkex_crawler_scrapling.py --name "Tencent" --output company.json

    # For debugging
    uv run python hkex_crawler_scrapling.py --code 82 --headless=false
"""

import argparse
import json
import sys
from typing import Optional, Tuple, List

try:
    from scrapling.fetchers import StealthyFetcher
except ImportError:
    print("Scrapling not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "scrapling[fetchers]"])
    print("Now installing browser...")
    subprocess.check_call([sys.executable, "-m", "scrapling", "install"])
    from scrapling.fetchers import StealthyFetcher

try:
    import yfinance as yf
except ImportError:
    print("yfinance not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "yfinance"])
    import yfinance as yf


def search_stock_by_name(company_name: str) -> Tuple[Optional[str], List[dict]]:
    """
    Search for HK stock code by company name using yfinance.

    Args:
        company_name: The company name to search for

    Returns:
        Tuple of (stock_code, all_matches)
        - stock_code: The stock code if exactly one match found, None otherwise
        - all_matches: List of all HK matches found
    """
    result = yf.Search(company_name, max_results=10)

    # Filter for Hong Kong stocks only
    hk_matches = [
        {
            "symbol": quote.get("symbol"),
            "code": quote.get("symbol", "").replace(".HK", "").lstrip("0") or quote.get("symbol", "").replace(".HK", ""),
            "name": quote.get("longname") or quote.get("shortname"),
            "exchange": quote.get("exchDisp", "Hong Kong"),
        }
        for quote in result.quotes
        if quote.get("exchange") == "HKG"
    ]

    if len(hk_matches) == 0:
        return None, []
    elif len(hk_matches) == 1:
        return hk_matches[0]["code"], hk_matches
    else:
        # Multiple matches - return None and let caller handle
        return None, hk_matches


def get_company_profile(stock_code: str, headless: bool = True, timeout: int = 30000) -> Optional[str]:
    """
    Fetch company profile text by stock code.

    Args:
        stock_code: The stock code (e.g., "82" for Crazy Sports Group)
        headless: Run browser in headless mode
        timeout: Page load timeout in milliseconds

    Returns:
        Company profile text or None if not found
    """
    url = f"https://www.hkex.com.hk/Market-Data/Securities-Prices/Equities/Equities-Quote?sym={stock_code}&sc_lang=en"
    # print(f"Fetching: {url}")

    try:
        page = StealthyFetcher.fetch(
            url,
            headless=headless,
            network_idle=True,
            timeout=timeout,
            stealthy_headers=True,
        )

        # Extract company profile text using multiple selectors
        profile_selectors = [
            'div.company_txt.col_summary::text',
            'div.company_txt::text',
            'div.col_summary::text',
        ]

        for selector in profile_selectors:
            element = page.css(selector)
            if element:
                text = element.get().strip()
                if len(text) > 10:
                    # print(f"Found content with selector: {selector}")
                    return text

        print("No company profile text found")
        return None

    except Exception as e:
        print(f"Error fetching stock code {stock_code}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Crawl company profile text from HKEX.com",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Search by stock code
    uv run python hkex_crawler_scrapling.py --code 82
    uv run python hkex_crawler_scrapling.py --code 82 --output company.json

    # Search by company name
    uv run python hkex_crawler_scrapling.py --name "Crazy Sports"
    uv run python hkex_crawler_scrapling.py --name "Tencent" --output company.json

    # For debugging
    uv run python hkex_crawler_scrapling.py --code 82 --headless=false
        """
    )

    # Mutually exclusive group for code vs name
    search_group = parser.add_mutually_exclusive_group(required=True)
    search_group.add_argument("--code", "-c", help="Stock code to fetch (e.g., 82, 0700)")
    search_group.add_argument("--name", "-n", help="Company name to search for")

    parser.add_argument("--output", "-o", help="Output file (JSON format)")
    parser.add_argument("--headless", "-H", type=lambda x: x.lower() != "false", default=True,
                        help="Run browser in headless mode (default: true)")
    parser.add_argument("--timeout", "-t", type=int, default=30000,
                        help="Page load timeout in milliseconds")

    args = parser.parse_args()

    # Determine stock code
    stock_code = args.code

    if args.name:
        print(f"Searching for company: {args.name}")
        stock_code, matches = search_stock_by_name(args.name)

        if len(matches) == 0:
            print(f"Error: No Hong Kong stocks found matching '{args.name}'")
            sys.exit(1)
        elif len(matches) > 1:
            print(f"Error: Multiple Hong Kong stocks found matching '{args.name}':")
            print("Please use a more specific name or use --code with the stock code directly.\n")
            print("Matches found:")
            for m in matches:
                print(f"  - {m['code']:>5} ({m['symbol']}): {m['name']}")
            sys.exit(1)
        # else:
        #     print(f"Found: {matches[0]['name']} (Stock code: {stock_code})")

    profile_text = get_company_profile(stock_code, args.headless, args.timeout)

    if profile_text:
        result = {
            "company_profile_text": profile_text
        }

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print(f"\nProfile saved to {args.output}")
        else:
            print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("Failed to fetch company profile")
        sys.exit(1)


if __name__ == "__main__":
    main()
