"""Scrape photo URLs for Hall of Fame players missing photos."""

import json
import time
import socket
import logging
import random
from pathlib import Path

import cloudscraper
import urllib3.util.connection as urllib3_connection
from bs4 import BeautifulSoup
from tqdm import tqdm
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests

# Force IPv4 to avoid network issues in WSL
urllib3_connection.allowed_gai_family = lambda: socket.AF_INET

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
MOBILE_JSON = PROJECT_ROOT / "apps/mobile/data/nfl_players.json"
WEB_JSON = PROJECT_ROOT / "apps/web/src/data/nfl_players.json"

# Rate limiting - more conservative
REQUEST_DELAY = 3.5  # seconds between requests (increased)
REQUEST_DELAY_JITTER = 1.0  # random jitter


def extract_photo_url(html: str) -> str | None:
    """Extract photo URL from PFR player page."""
    soup = BeautifulSoup(html, 'html.parser')
    meta = soup.find('div', id='meta')
    if not meta:
        return None

    media_item = meta.find('div', class_='media-item')
    if not media_item:
        return None

    img = media_item.find('img')
    if img:
        return img.get('src')
    return None


class RateLimitError(Exception):
    """Raised when rate limited."""
    pass


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=10, min=30, max=120),
    retry=retry_if_exception_type(RateLimitError)
)
def fetch_with_retry(session, url):
    """Fetch URL with retry on rate limit."""
    response = session.get(url, timeout=30)
    if response.status_code == 429:
        raise RateLimitError("Rate limited")
    response.raise_for_status()
    return response


def scrape_hof_photos():
    """Scrape photos for HOF players missing them."""
    # Load players
    with open(MOBILE_JSON, 'r') as f:
        players = json.load(f)

    # Find HOF players without photos
    hof_no_photo = [
        (i, p) for i, p in enumerate(players)
        if p.get('hallOfFame') == True and not p.get('photoUrl')
    ]

    logger.info(f"Found {len(hof_no_photo)} HOF players without photos")

    # Create session
    session = cloudscraper.create_scraper()

    # Track results
    found = 0
    not_found = 0
    errors = 0

    # Scrape each player
    for idx, player in tqdm(hof_no_photo, desc="Scraping HOF photos"):
        url = player.get('sportsReferenceUrl')
        if not url:
            not_found += 1
            continue

        try:
            response = fetch_with_retry(session, url)

            photo_url = extract_photo_url(response.text)

            if photo_url:
                # Update player in list
                players[idx]['photoUrl'] = photo_url
                found += 1
                logger.debug(f"Found photo for {player['name']}: {photo_url}")
            else:
                not_found += 1
                logger.debug(f"No photo available for {player['name']}")

        except RateLimitError:
            errors += 1
            logger.warning(f"Rate limited for {player['name']} after retries")
        except Exception as e:
            errors += 1
            logger.warning(f"Error fetching {player['name']}: {e}")

        # Rate limiting with jitter
        delay = REQUEST_DELAY + random.uniform(0, REQUEST_DELAY_JITTER)
        time.sleep(delay)

    logger.info(f"Results: {found} found, {not_found} not available, {errors} errors")

    # Save to mobile JSON
    with open(MOBILE_JSON, 'w') as f:
        json.dump(players, f, indent=2)
    logger.info(f"Saved to {MOBILE_JSON}")

    # Save to web JSON
    with open(WEB_JSON, 'w') as f:
        json.dump(players, f, indent=2)
    logger.info(f"Saved to {WEB_JSON}")

    return found, not_found, errors


if __name__ == "__main__":
    scrape_hof_photos()
