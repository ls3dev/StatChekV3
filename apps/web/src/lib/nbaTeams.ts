export type NBATeamInfo = {
  id: number;
  name: string;
  city: string;
  abbreviation: string;
};

export const NBA_TEAMS: Record<number, NBATeamInfo> = {
  1: { id: 1, name: "Hawks", city: "Atlanta", abbreviation: "ATL" },
  2: { id: 2, name: "Celtics", city: "Boston", abbreviation: "BOS" },
  3: { id: 3, name: "Nets", city: "Brooklyn", abbreviation: "BKN" },
  4: { id: 4, name: "Hornets", city: "Charlotte", abbreviation: "CHA" },
  5: { id: 5, name: "Bulls", city: "Chicago", abbreviation: "CHI" },
  6: { id: 6, name: "Cavaliers", city: "Cleveland", abbreviation: "CLE" },
  7: { id: 7, name: "Mavericks", city: "Dallas", abbreviation: "DAL" },
  8: { id: 8, name: "Nuggets", city: "Denver", abbreviation: "DEN" },
  9: { id: 9, name: "Pistons", city: "Detroit", abbreviation: "DET" },
  10: { id: 10, name: "Warriors", city: "Golden State", abbreviation: "GSW" },
  11: { id: 11, name: "Rockets", city: "Houston", abbreviation: "HOU" },
  12: { id: 12, name: "Pacers", city: "Indiana", abbreviation: "IND" },
  13: { id: 13, name: "Clippers", city: "LA", abbreviation: "LAC" },
  14: { id: 14, name: "Lakers", city: "Los Angeles", abbreviation: "LAL" },
  15: { id: 15, name: "Grizzlies", city: "Memphis", abbreviation: "MEM" },
  16: { id: 16, name: "Heat", city: "Miami", abbreviation: "MIA" },
  17: { id: 17, name: "Bucks", city: "Milwaukee", abbreviation: "MIL" },
  18: { id: 18, name: "Timberwolves", city: "Minnesota", abbreviation: "MIN" },
  19: { id: 19, name: "Pelicans", city: "New Orleans", abbreviation: "NOP" },
  20: { id: 20, name: "Knicks", city: "New York", abbreviation: "NYK" },
  21: { id: 21, name: "Thunder", city: "Oklahoma City", abbreviation: "OKC" },
  22: { id: 22, name: "Magic", city: "Orlando", abbreviation: "ORL" },
  23: { id: 23, name: "76ers", city: "Philadelphia", abbreviation: "PHI" },
  24: { id: 24, name: "Suns", city: "Phoenix", abbreviation: "PHX" },
  25: { id: 25, name: "Trail Blazers", city: "Portland", abbreviation: "POR" },
  26: { id: 26, name: "Kings", city: "Sacramento", abbreviation: "SAC" },
  27: { id: 27, name: "Spurs", city: "San Antonio", abbreviation: "SAS" },
  28: { id: 28, name: "Raptors", city: "Toronto", abbreviation: "TOR" },
  29: { id: 29, name: "Jazz", city: "Utah", abbreviation: "UTA" },
  30: { id: 30, name: "Wizards", city: "Washington", abbreviation: "WAS" },
};

export const NBA_TEAM_LIST = Object.values(NBA_TEAMS).sort((a, b) =>
  `${a.city} ${a.name}`.localeCompare(`${b.city} ${b.name}`)
);
