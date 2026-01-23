"""HTML parsing for Pro Football Reference Pro Bowl pages."""

import re
from typing import List, Optional
from bs4 import BeautifulSoup

from config import PFR_BASE_URL, POSITION_MAPPINGS, TEAM_MAPPINGS


def parse_probowl_year_page(html: str, year: int) -> List[dict]:
    """
    Parse a Pro Bowl year page to extract player info.

    URL format: https://www.pro-football-reference.com/years/{year}/probowl.htm

    Returns list of player info dicts with:
    - name: Player's full name
    - url: Full URL to player's page
    - position: Position
    - team: Team abbreviation
    """
    soup = BeautifulSoup(html, "lxml")
    players = []
    seen_urls = set()

    # Find all player tables (AFC and NFC rosters)
    tables = soup.find_all("table")

    for table in tables:
        # Look for player links in the table
        for row in table.find_all("tr"):
            cells = row.find_all(["td", "th"])

            for cell in cells:
                # Find player links
                link = cell.find("a", href=re.compile(r"/players/[A-Z]/"))
                if link and link.get("href"):
                    href = link.get("href")
                    url = f"{PFR_BASE_URL}{href}" if href.startswith("/") else href

                    # Skip duplicates within this page
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)

                    name = link.get_text(strip=True)
                    if not name:
                        continue

                    # Try to get position and team from the row
                    position = ""
                    team = ""

                    # Look for position in data-stat attribute or cell content
                    for c in cells:
                        data_stat = c.get("data-stat", "")
                        text = c.get_text(strip=True)

                        if data_stat == "pos" or data_stat == "position":
                            raw_pos = text.upper()
                            position = POSITION_MAPPINGS.get(raw_pos, raw_pos)
                        elif data_stat == "team":
                            team = TEAM_MAPPINGS.get(text.upper(), text.upper())

                    players.append({
                        "name": name,
                        "url": url,
                        "position": position,
                        "team": team,
                        "pro_bowl_year": year,
                    })

    # Also check for standalone player links outside tables
    for link in soup.find_all("a", href=re.compile(r"/players/[A-Z]/[A-Za-z]+\d+\.htm")):
        href = link.get("href")
        url = f"{PFR_BASE_URL}{href}" if href.startswith("/") else href

        if url in seen_urls:
            continue
        seen_urls.add(url)

        name = link.get_text(strip=True)
        if name and len(name) > 2:  # Filter out very short text
            players.append({
                "name": name,
                "url": url,
                "position": "",
                "team": "",
                "pro_bowl_year": year,
            })

    return players


def parse_probowl_index_page(html: str) -> List[int]:
    """
    Parse the Pro Bowl index page to get available years.

    Returns list of years with Pro Bowl data.
    """
    soup = BeautifulSoup(html, "lxml")
    years = []

    # Find links to Pro Bowl year pages
    for link in soup.find_all("a", href=re.compile(r"/years/\d{4}/probowl\.htm")):
        href = link.get("href", "")
        match = re.search(r"/years/(\d{4})/probowl\.htm", href)
        if match:
            year = int(match.group(1))
            if year not in years:
                years.append(year)

    return sorted(years)


def parse_player_page(html: str) -> dict:
    """
    Parse a player's detail page for additional info.

    Returns dict with:
    - team: Last/primary team
    - position: Position
    - photo_url: Player photo URL
    - hall_of_fame: Whether player is in Hall of Fame
    """
    soup = BeautifulSoup(html, "lxml")
    result = {
        "team": "",
        "position": "",
        "photo_url": "",
        "hall_of_fame": False,
    }

    # Check for Hall of Fame indicator
    meta = soup.find("div", {"id": "meta"})
    if meta:
        meta_text = meta.get_text()
        if "Hall of Fame" in meta_text:
            result["hall_of_fame"] = True

    # Try to get player photo
    media_item = soup.find("div", {"class": "media-item"})
    if media_item:
        img = media_item.find("img")
        if img and img.get("src"):
            result["photo_url"] = img["src"]

    # Get position from meta info
    if meta:
        for p in meta.find_all("p"):
            text = p.get_text()
            if "Position:" in text or "Position" in text:
                # Extract position
                pos_match = re.search(r"Position:\s*([A-Z]+)", text)
                if pos_match:
                    raw_pos = pos_match.group(1)
                    result["position"] = POSITION_MAPPINGS.get(raw_pos, raw_pos)

    return result
