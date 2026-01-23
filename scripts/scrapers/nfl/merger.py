"""Merge scraped Pro Bowl players with existing player database."""

import json
import logging
from pathlib import Path
from typing import List, Dict, Set

from rapidfuzz import fuzz

from config import MOBILE_JSON_PATH, WEB_JSON_PATH, SCRAPED_DATA_PATH
from models import NFLPlayer, NFLPlayerStats

logger = logging.getLogger(__name__)


class PlayerMerger:
    """Merge scraped Pro Bowl players with existing database."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.existing_players: List[dict] = []
        self.scraped_players: List[dict] = []
        self.url_to_existing: Dict[str, dict] = {}

    def load_existing(self) -> int:
        """Load existing player database. Returns count."""
        path = self.project_root / MOBILE_JSON_PATH
        if path.exists():
            with open(path, "r") as f:
                self.existing_players = json.load(f)

            # Build URL index
            for player in self.existing_players:
                url = player.get("sportsReferenceUrl", "")
                if url:
                    self.url_to_existing[url] = player

            logger.info(f"Loaded {len(self.existing_players)} existing players")
            return len(self.existing_players)
        return 0

    def load_scraped(self) -> int:
        """Load scraped players. Returns count."""
        path = self.project_root / SCRAPED_DATA_PATH
        if path.exists():
            with open(path, "r") as f:
                self.scraped_players = json.load(f)
            logger.info(f"Loaded {len(self.scraped_players)} scraped Pro Bowl players")
            return len(self.scraped_players)
        return 0

    def merge(self) -> List[dict]:
        """
        Merge scraped Pro Bowl players with existing database.

        - Skip players that already exist (by URL)
        - Add new players with pro_bowl=True
        """
        self.load_existing()
        self.load_scraped()

        # Track seen URLs to prevent duplicates
        seen_urls: Set[str] = set()
        merged: List[dict] = []

        stats = {
            "existing_kept": 0,
            "new_added": 0,
            "duplicates_skipped": 0,
        }

        # First, keep all existing players
        for player in self.existing_players:
            url = player.get("sportsReferenceUrl", "")
            if url:
                seen_urls.add(url)
            merged.append(player)
            stats["existing_kept"] += 1

        # Find max ID for new players
        max_id = max((int(p.get("id", 0)) for p in self.existing_players), default=0)
        next_id = max_id + 1

        # Add new scraped players (only those not already in database)
        for scraped in self.scraped_players:
            url = scraped.get("url", "")

            # Skip if already exists
            if url in seen_urls:
                stats["duplicates_skipped"] += 1
                continue

            # Skip if URL matches existing player
            if url in self.url_to_existing:
                stats["duplicates_skipped"] += 1
                continue

            # New player - add to database
            new_player = NFLPlayer(
                id=str(next_id),
                name=scraped.get("name", ""),
                sport="NFL",
                team=scraped.get("team", ""),
                position=scraped.get("position", ""),
                number="",
                photoUrl="",
                sportsReferenceUrl=url,
                hallOfFame=False,  # Pro Bowl != Hall of Fame
            )
            merged.append(new_player.to_dict())
            seen_urls.add(url)
            next_id += 1
            stats["new_added"] += 1

        logger.info(f"Merge stats: {stats}")
        logger.info(f"Total players after merge: {len(merged)}")

        return merged

    def save_merged(self, players: List[dict]):
        """Save merged database to both mobile and web locations."""
        # Sort by name for consistency
        players.sort(key=lambda p: p.get("name", "").lower())

        # Re-assign IDs in order
        for i, player in enumerate(players, 1):
            player["id"] = str(i)

        # Save to mobile
        mobile_path = self.project_root / MOBILE_JSON_PATH
        with open(mobile_path, "w") as f:
            json.dump(players, f, indent=2)
        logger.info(f"Saved to {mobile_path}")

        # Save to web
        web_path = self.project_root / WEB_JSON_PATH
        with open(web_path, "w") as f:
            json.dump(players, f, indent=2)
        logger.info(f"Saved to {web_path}")

    def get_stats(self, players: List[dict]) -> dict:
        """Get statistics about the merged database."""
        hof_count = sum(1 for p in players if p.get("hallOfFame", False))
        positions = {}
        for p in players:
            pos = p.get("position", "Unknown") or "Unknown"
            positions[pos] = positions.get(pos, 0) + 1

        return {
            "total_players": len(players),
            "hall_of_fame": hof_count,
            "positions": dict(sorted(positions.items(), key=lambda x: -x[1])[:10]),
            "has_photo": sum(1 for p in players if p.get("photoUrl")),
            "has_url": sum(1 for p in players if p.get("sportsReferenceUrl")),
        }


def run_merge(project_root: Path) -> dict:
    """Run the merge process and return stats."""
    merger = PlayerMerger(project_root)
    merged = merger.merge()
    merger.save_merged(merged)
    return merger.get_stats(merged)
