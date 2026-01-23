"""Pro Bowl player scraper with rate limiting."""

import json
import time
import socket
import logging
from pathlib import Path
from typing import List, Set, Dict

import cloudscraper
import urllib3.util.connection as urllib3_connection
from tenacity import retry, stop_after_attempt, wait_exponential
from tqdm import tqdm

# Force IPv4 to avoid network issues in WSL
urllib3_connection.allowed_gai_family = lambda: socket.AF_INET

from config import (
    PFR_BASE_URL,
    PFR_PROBOWL_INDEX,
    PROBOWL_START_YEAR,
    PROBOWL_END_YEAR,
    REQUEST_DELAY_SECONDS,
    MAX_RETRIES,
    CHECKPOINT_EVERY,
    CHECKPOINT_PATH,
    SCRAPED_DATA_PATH,
    MOBILE_JSON_PATH,
)
from parser import parse_probowl_year_page

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class ProBowlScraper:
    """Scraper for Pro Football Reference Pro Bowl data."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.session = cloudscraper.create_scraper()
        self.scraped_players: Dict[str, dict] = {}  # url -> player data
        self.current_year = PROBOWL_START_YEAR
        self.existing_urls: Set[str] = set()

    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=4, max=60)
    )
    def fetch_page(self, url: str) -> str:
        """Fetch a page with retry logic."""
        logger.debug(f"Fetching: {url}")
        response = self.session.get(url, timeout=30)
        response.raise_for_status()
        return response.text

    def load_existing_players(self):
        """Load existing player database to get URLs for deduplication."""
        path = self.project_root / MOBILE_JSON_PATH
        if path.exists():
            with open(path, "r") as f:
                players = json.load(f)
            for player in players:
                url = player.get("sportsReferenceUrl", "")
                if url:
                    self.existing_urls.add(url)
            logger.info(f"Loaded {len(self.existing_urls)} existing player URLs for deduplication")

    def load_checkpoint(self) -> bool:
        """Load checkpoint if exists. Returns True if checkpoint loaded."""
        checkpoint_path = self.project_root / CHECKPOINT_PATH
        if checkpoint_path.exists():
            try:
                with open(checkpoint_path, "r") as f:
                    checkpoint = json.load(f)
                self.current_year = checkpoint.get("current_year", PROBOWL_START_YEAR)

                # Load existing scraped data
                scraped_path = self.project_root / SCRAPED_DATA_PATH
                if scraped_path.exists():
                    with open(scraped_path, "r") as f:
                        data = json.load(f)
                        self.scraped_players = {p["url"]: p for p in data}
                    logger.info(f"Loaded {len(self.scraped_players)} previously scraped players")

                logger.info(f"Loaded checkpoint: year {self.current_year}")
                return True
            except Exception as e:
                logger.warning(f"Failed to load checkpoint: {e}")
        return False

    def save_checkpoint(self):
        """Save current progress."""
        checkpoint_path = self.project_root / CHECKPOINT_PATH
        checkpoint = {
            "current_year": self.current_year,
        }
        with open(checkpoint_path, "w") as f:
            json.dump(checkpoint, f)

        # Save scraped players
        scraped_path = self.project_root / SCRAPED_DATA_PATH
        with open(scraped_path, "w") as f:
            json.dump(list(self.scraped_players.values()), f, indent=2)

        logger.info(f"Checkpoint saved: {len(self.scraped_players)} unique players")

    def scrape_year(self, year: int) -> List[dict]:
        """Scrape Pro Bowl roster for a specific year."""
        url = f"{PFR_BASE_URL}/years/{year}/probowl.htm"
        logger.info(f"Scraping Pro Bowl {year}")

        try:
            html = self.fetch_page(url)
            players = parse_probowl_year_page(html, year)
            logger.info(f"Found {len(players)} players in {year} Pro Bowl")
            return players
        except Exception as e:
            error_str = str(e)
            if "404" in error_str or "Not Found" in error_str:
                logger.warning(f"No Pro Bowl data for {year}")
                return []
            logger.error(f"Error scraping year {year}: {e}")
            return []

    def scrape_all(self, resume: bool = True) -> List[dict]:
        """
        Scrape all Pro Bowl rosters.

        Args:
            resume: If True, resume from checkpoint if available
        """
        # Load existing players for deduplication
        self.load_existing_players()

        if resume:
            self.load_checkpoint()

        years = list(range(self.current_year, PROBOWL_END_YEAR + 1))
        total_new = 0

        # Progress bar for years
        for year in tqdm(years, desc="Pro Bowl Years"):
            players = self.scrape_year(year)

            for player_info in players:
                url = player_info["url"]

                # Skip if already in existing database
                if url in self.existing_urls:
                    continue

                # Skip if already scraped (dedup within scrape)
                if url in self.scraped_players:
                    # Update with additional Pro Bowl year info if needed
                    continue

                # New player
                self.scraped_players[url] = {
                    "name": player_info["name"],
                    "url": url,
                    "position": player_info.get("position", ""),
                    "team": player_info.get("team", ""),
                    "pro_bowl": True,
                }
                total_new += 1

            # Update year for checkpoint
            self.current_year = year + 1

            # Rate limiting between years
            time.sleep(REQUEST_DELAY_SECONDS)

            # Save checkpoint after each year
            if year % 5 == 0:
                self.save_checkpoint()

        # Final save
        self.save_checkpoint()

        logger.info(f"Scraping complete. Total new Pro Bowl players: {total_new}")
        logger.info(f"Total unique Pro Bowlers scraped: {len(self.scraped_players)}")

        return list(self.scraped_players.values())

    def get_stats(self) -> dict:
        """Get scraping statistics."""
        return {
            "total_unique_players": len(self.scraped_players),
            "years_scraped": self.current_year - PROBOWL_START_YEAR,
            "existing_players_skipped": len(self.existing_urls),
        }


def run_scraper(project_root: Path, resume: bool = True) -> List[dict]:
    """Run the scraper and return results."""
    scraper = ProBowlScraper(project_root)
    players = scraper.scrape_all(resume=resume)

    stats = scraper.get_stats()
    logger.info(f"Final stats: {stats}")

    return players
