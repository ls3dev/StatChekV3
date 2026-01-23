"""Configuration for NFL Pro Bowl player scraper."""

# Base URL for Pro Football Reference
PFR_BASE_URL = "https://www.pro-football-reference.com"
PFR_PROBOWL_INDEX = f"{PFR_BASE_URL}/probowl/"

# Pro Bowl years to scrape (1950-2024)
PROBOWL_START_YEAR = 1950
PROBOWL_END_YEAR = 2024

# Rate limiting
REQUEST_DELAY_SECONDS = 3  # Respectful delay between requests
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 10

# Checkpoint frequency
CHECKPOINT_EVERY = 50  # Save progress every N players

# Output paths (relative to project root)
MOBILE_JSON_PATH = "apps/mobile/data/nfl_players.json"
WEB_JSON_PATH = "apps/web/src/data/nfl_players.json"
CHECKPOINT_PATH = "scripts/scrapers/nfl/checkpoint.json"
SCRAPED_DATA_PATH = "scripts/scrapers/nfl/scraped_players.json"

# Position mappings from PFR abbreviations to standardized format
POSITION_MAPPINGS = {
    # Offense
    "QB": "QB",
    "RB": "RB",
    "FB": "FB",
    "HB": "RB",  # Halfback -> Running Back
    "WR": "WR",
    "TE": "TE",
    "T": "OT",
    "OT": "OT",
    "G": "OG",
    "OG": "OG",
    "C": "C",
    "OL": "OL",
    "LT": "OT",
    "RT": "OT",
    "LG": "OG",
    "RG": "OG",

    # Defense
    "DE": "DE",
    "DT": "DT",
    "NT": "NT",
    "DL": "DL",
    "LB": "LB",
    "ILB": "ILB",
    "OLB": "OLB",
    "MLB": "MLB",
    "CB": "CB",
    "S": "S",
    "SS": "SS",
    "FS": "FS",
    "DB": "DB",
    "LDE": "DE",
    "RDE": "DE",
    "LDT": "DT",
    "RDT": "DT",
    "LILB": "ILB",
    "RILB": "ILB",
    "LOLB": "OLB",
    "ROLB": "OLB",
    "LCB": "CB",
    "RCB": "CB",
    "NB": "CB",  # Nickelback

    # Special Teams
    "K": "K",
    "P": "P",
    "LS": "LS",
    "KR": "KR",
    "PR": "PR",
    "ST": "ST",  # Special Teams

    # Historical/Generic
    "E": "E",  # End (historical)
    "FL": "WR",  # Flanker -> WR
    "SE": "WR",  # Split End -> WR
    "BB": "RB",  # Blocking Back -> RB
    "WB": "RB",  # Wingback -> RB
    "TB": "RB",  # Tailback -> RB
}

# Team abbreviation mappings (PFR -> standard)
TEAM_MAPPINGS = {
    "ARI": "ARI", "ATL": "ATL", "BAL": "BAL", "BUF": "BUF",
    "CAR": "CAR", "CHI": "CHI", "CIN": "CIN", "CLE": "CLE",
    "DAL": "DAL", "DEN": "DEN", "DET": "DET", "GNB": "GB",
    "HOU": "HOU", "IND": "IND", "JAX": "JAX", "KAN": "KC",
    "LVR": "LV", "LAC": "LAC", "LAR": "LAR", "MIA": "MIA",
    "MIN": "MIN", "NWE": "NE", "NOR": "NO", "NYG": "NYG",
    "NYJ": "NYJ", "PHI": "PHI", "PIT": "PIT", "SFO": "SF",
    "SEA": "SEA", "TAM": "TB", "TEN": "TEN", "WAS": "WAS",
    # Historical teams
    "RAI": "LV", "OAK": "LV", "SDG": "LAC", "STL": "LAR",
    "RAM": "LAR", "PHO": "ARI", "CRD": "ARI", "BOS": "NE",
    "CLT": "IND", "HST": "TEN", "OIL": "TEN",
}
