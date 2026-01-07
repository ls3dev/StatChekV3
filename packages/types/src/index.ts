// Player types
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

// Full player list with players and links (local storage)
export type PlayerList = {
  id: string;
  name: string;
  description?: string;
  players: PlayerListItem[];
  links: PlayerListLink[];
  createdAt: number;
  updatedAt: number;
};

// Player link for individual players
export type PlayerLink = {
  id: string;
  playerId: string;
  url: string;
  title: string;
  order: number;
  createdAt: number;
};

export type PlayerLinksMap = {
  [playerId: string]: PlayerLink[];
};

// ============================================
// Shared List Types (for Convex/Web sharing)
// ============================================

// Denormalized player data for shared lists (snapshot)
export type SharedPlayer = {
  playerId: string;
  order: number;
  name: string;
  team: string;
  position: string;
  photoUrl?: string;
  sportsReferenceUrl?: string;
  hallOfFame?: boolean;
};

// Shared list (stored in Convex)
export type SharedList = {
  shareId: string;
  name: string;
  description?: string;
  players: SharedPlayer[];
  links: PlayerListLink[];
  sharedBy?: string;
  sharedByName?: string;
  sharedAt: number;
  viewCount: number;
  isPublic: boolean;
  originalCreatedAt: number;
  originalUpdatedAt: number;
};
