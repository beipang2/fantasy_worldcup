"""
FIFA 2026 World Cup squad scraper.
Uses Playwright to load each team's squad page and intercepts the API response.

Install:
    pip install playwright
    playwright install chromium

Usage:
    python scrape_squads.py              # scrape all 32 teams
    python scrape_squads.py --team usa   # single team for testing
"""

import json
import time
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams/{team}/squad"

# All 32 qualified team slugs as used in FIFA URLs
TEAMS = [
    "usa", "canada", "mexico",           # hosts
    "argentina", "brazil", "uruguay",
    "colombia", "ecuador", "venezuela",
    "germany", "france", "spain",
    "england", "portugal", "netherlands",
    "belgium", "croatia", "switzerland",
    "austria", "denmark", "serbia",
    "turkey", "ukraine", "poland",
    "morocco", "senegal", "nigeria",
    "cameroon", "southafrica",
    "japan", "southkorea", "australia",
]

OUTPUT_DIR = Path(__file__).parent / "data"


def scrape_team(page, team_slug: str) -> dict | None:
    captured = {}

    def handle_response(response):
        if "squad" in response.url and ("cxm-api" in response.url or "api.fifa" in response.url):
            try:
                captured["url"] = response.url
                captured["data"] = response.json()
                print(f"  ✓ Caught API response: {response.url}")
            except Exception as e:
                print(f"  ✗ Failed to parse response: {e}")

    page.on("response", handle_response)

    url = BASE_URL.format(team=team_slug)
    print(f"\nLoading {url}")
    try:
        page.goto(url, timeout=30000)
        page.wait_for_timeout(5000)
    except Exception as e:
        print(f"  ✗ Page load failed: {e}")

    page.remove_listener("response", handle_response)
    return captured or None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--team", help="Single team slug to test (e.g. usa)")
    args = parser.parse_args()

    teams = [args.team] if args.team else TEAMS
    OUTPUT_DIR.mkdir(exist_ok=True)

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for team in teams:
            result = scrape_team(page, team)
            if result:
                results[team] = result
                # Save per-team file immediately
                out = OUTPUT_DIR / f"{team}.json"
                out.write_text(json.dumps(result, indent=2, ensure_ascii=False))
                print(f"  Saved → {out}")
            else:
                print(f"  ✗ No data captured for {team}")

            time.sleep(2)  # be polite

        browser.close()

    # Save combined file
    combined = OUTPUT_DIR / "all_squads.json"
    combined.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\nDone. {len(results)}/{len(teams)} teams saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
