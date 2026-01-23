#!/usr/bin/env python3
"""CLI entry point for NFL Pro Bowl player scraper."""

import argparse
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from scraper import ProBowlScraper
from merger import run_merge, PlayerMerger
from config import PROBOWL_START_YEAR, PROBOWL_END_YEAR


def setup_logging(verbose: bool = False):
    """Configure logging."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("scraper.log"),
        ]
    )


def find_project_root() -> Path:
    """Find the project root directory."""
    current = Path(__file__).resolve().parent
    while current != current.parent:
        if (current / "package.json").exists() or (current / "apps").exists():
            return current
        current = current.parent
    raise RuntimeError("Could not find project root")


def cmd_scrape(args):
    """Run the Pro Bowl scraper."""
    project_root = find_project_root()
    logging.info(f"Project root: {project_root}")
    logging.info(f"Scraping Pro Bowl rosters from {PROBOWL_START_YEAR} to {PROBOWL_END_YEAR}")

    scraper = ProBowlScraper(project_root)
    players = scraper.scrape_all(resume=not args.fresh)

    stats = scraper.get_stats()
    print("\n" + "=" * 50)
    print("Pro Bowl Scraping Complete!")
    print("=" * 50)
    print(f"Unique Pro Bowlers scraped: {stats['total_unique_players']}")
    print(f"Years scraped: {stats['years_scraped']}")
    print(f"Existing players skipped: {stats['existing_players_skipped']}")
    print("=" * 50)
    print("\nRun 'python run_scraper.py merge' to add new players to the database.")


def cmd_merge(args):
    """Run the merge process."""
    project_root = find_project_root()
    logging.info(f"Project root: {project_root}")

    stats = run_merge(project_root)

    print("\n" + "=" * 50)
    print("Merge Complete!")
    print("=" * 50)
    print(f"Total players: {stats['total_players']}")
    print(f"Hall of Famers: {stats['hall_of_fame']}")
    print(f"Players with photos: {stats['has_photo']}")
    print(f"Players with PFR URLs: {stats['has_url']}")
    print("\nTop positions:")
    for pos, count in list(stats['positions'].items())[:5]:
        print(f"  {pos}: {count}")
    print("=" * 50)


def cmd_stats(args):
    """Show current stats without running anything."""
    project_root = find_project_root()

    merger = PlayerMerger(project_root)
    existing_count = merger.load_existing()
    scraped_count = merger.load_scraped()

    print("\n" + "=" * 50)
    print("Current Statistics")
    print("=" * 50)
    print(f"Existing players in database: {existing_count}")
    print(f"Scraped Pro Bowlers (pending merge): {scraped_count}")

    if merger.existing_players:
        hof = sum(1 for p in merger.existing_players if p.get("hallOfFame", False))
        print(f"Current Hall of Famers: {hof}")

    # Check for checkpoint
    checkpoint_path = project_root / "scripts/scrapers/nfl/checkpoint.json"
    if checkpoint_path.exists():
        import json
        with open(checkpoint_path) as f:
            checkpoint = json.load(f)
        year = checkpoint.get("current_year", PROBOWL_START_YEAR)
        print(f"\nCheckpoint: Next year to scrape = {year}")

    print("=" * 50)


def cmd_validate(args):
    """Validate the merged JSON file."""
    project_root = find_project_root()

    import json
    from config import MOBILE_JSON_PATH, WEB_JSON_PATH

    errors = []
    warnings = []

    for path_str in [MOBILE_JSON_PATH, WEB_JSON_PATH]:
        path = project_root / path_str
        print(f"\nValidating: {path}")

        if not path.exists():
            errors.append(f"File not found: {path}")
            continue

        try:
            with open(path) as f:
                players = json.load(f)
        except json.JSONDecodeError as e:
            errors.append(f"Invalid JSON in {path}: {e}")
            continue

        # Check structure
        if not isinstance(players, list):
            errors.append(f"{path}: Root should be an array")
            continue

        seen_ids = set()
        seen_urls = set()
        required_fields = ["id", "name", "sport", "team", "position", "number",
                         "photoUrl", "sportsReferenceUrl", "stats", "hallOfFame"]

        for i, player in enumerate(players):
            # Check required fields
            for field in required_fields:
                if field not in player:
                    errors.append(f"Player {i}: Missing field '{field}'")

            # Check for duplicate IDs
            pid = player.get("id")
            if pid in seen_ids:
                errors.append(f"Duplicate ID: {pid}")
            seen_ids.add(pid)

            # Check for duplicate URLs
            url = player.get("sportsReferenceUrl")
            if url and url in seen_urls:
                warnings.append(f"Duplicate URL: {url}")
            if url:
                seen_urls.add(url)

            # Check stats structure
            stats = player.get("stats", {})
            if not isinstance(stats, dict):
                errors.append(f"Player {pid}: stats should be an object")

        # Summary
        hof_count = sum(1 for p in players if p.get("hallOfFame", False))
        print(f"  Total players: {len(players)}")
        print(f"  Hall of Famers: {hof_count}")
        print(f"  Unique IDs: {len(seen_ids)}")
        print(f"  Players with URLs: {len(seen_urls)}")

    print("\n" + "=" * 50)
    if errors:
        print(f"ERRORS ({len(errors)}):")
        for e in errors[:10]:
            print(f"  - {e}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")
    else:
        print("No errors found!")

    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings[:5]:
            print(f"  - {w}")
        if len(warnings) > 5:
            print(f"  ... and {len(warnings) - 5} more")

    print("=" * 50)
    return len(errors) == 0


def main():
    parser = argparse.ArgumentParser(
        description="NFL Pro Bowl Player Scraper for StatCheck",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_scraper.py scrape          # Start/resume scraping Pro Bowl rosters
  python run_scraper.py scrape --fresh  # Start fresh, ignore checkpoint
  python run_scraper.py merge           # Merge scraped data with existing
  python run_scraper.py stats           # Show current statistics
  python run_scraper.py validate        # Validate JSON files

Estimated time: ~4 minutes (75 years × 3s delay)
        """
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Scrape command
    scrape_parser = subparsers.add_parser("scrape", help="Scrape Pro Bowl players from PFR")
    scrape_parser.add_argument("--fresh", action="store_true",
                               help="Start fresh, ignore checkpoint")
    scrape_parser.set_defaults(func=cmd_scrape)

    # Merge command
    merge_parser = subparsers.add_parser("merge", help="Merge scraped data with existing")
    merge_parser.set_defaults(func=cmd_merge)

    # Stats command
    stats_parser = subparsers.add_parser("stats", help="Show current statistics")
    stats_parser.set_defaults(func=cmd_stats)

    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate JSON files")
    validate_parser.set_defaults(func=cmd_validate)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    setup_logging(args.verbose)
    args.func(args)


if __name__ == "__main__":
    main()
