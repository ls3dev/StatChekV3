export type Player = {
  id: string;
  name: string;
  sport: string;
  team: string;
  position: string;
  number: string;
  photoUrl?: string;
  sportsReferenceUrl?: string;
  stats?: Record<string, number>;
  hallOfFame?: boolean;
};

// Player list item - reference to a player in a list with order
export type PlayerListItem = {
  playerId: string;
  sport?: string; // Sport for scoped player lookup (optional for backwards compat)
  order: number;
  addedAt: number;
};

// Link attached to a list (not a player)
export type PlayerListLink = {
  id: string;
  url: string;
  title: string;
  order: number;
};

// Full player list with players and links
export type PlayerList = {
  id: string;
  name: string;
  description?: string;
  players: PlayerListItem[];
  links: PlayerListLink[];
  createdAt: number;
  updatedAt: number;
};
