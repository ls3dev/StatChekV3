"""Data models for NFL player scraper."""

from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any


@dataclass
class NFLPlayerStats:
    """Player statistics matching existing JSON structure."""
    passing_yards: int = 0
    rushing_yards: int = 0
    touchdowns: int = 0

    def to_dict(self) -> Dict[str, int]:
        return asdict(self)


@dataclass
class NFLPlayer:
    """NFL Player matching existing JSON structure."""
    id: str
    name: str
    sport: str = "NFL"
    team: str = ""
    position: str = ""
    number: str = ""
    photoUrl: str = ""
    sportsReferenceUrl: str = ""
    stats: NFLPlayerStats = None
    hallOfFame: bool = False

    def __post_init__(self):
        if self.stats is None:
            self.stats = NFLPlayerStats()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary matching JSON format."""
        return {
            "id": self.id,
            "name": self.name,
            "sport": self.sport,
            "team": self.team,
            "position": self.position,
            "number": self.number,
            "photoUrl": self.photoUrl,
            "sportsReferenceUrl": self.sportsReferenceUrl,
            "stats": self.stats.to_dict() if isinstance(self.stats, NFLPlayerStats) else self.stats,
            "hallOfFame": self.hallOfFame,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "NFLPlayer":
        """Create from dictionary."""
        stats_data = data.get("stats", {})
        stats = NFLPlayerStats(
            passing_yards=stats_data.get("passing_yards", 0),
            rushing_yards=stats_data.get("rushing_yards", 0),
            touchdowns=stats_data.get("touchdowns", 0),
        )
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            sport=data.get("sport", "NFL"),
            team=data.get("team", ""),
            position=data.get("position", ""),
            number=data.get("number", ""),
            photoUrl=data.get("photoUrl", ""),
            sportsReferenceUrl=data.get("sportsReferenceUrl", ""),
            stats=stats,
            hallOfFame=data.get("hallOfFame", False),
        )
