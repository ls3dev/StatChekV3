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

export type ListType = 'ranking' | 'agenda' | 'vs';

export type ProfileSaveType = 'receipt' | 'playerStatSnapshot';

// Player list item - reference to a player in a list with order
export type PlayerListItem = {
  playerId: string;
  sport?: string;
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
  listType: ListType;
  players: PlayerListItem[];
  links: PlayerListLink[];
  createdAt: number;
  updatedAt: number;
};

export type ProfileSave = {
  id: string;
  type: ProfileSaveType;
  title: string;
  subtitle?: string;
  note?: string;
  url?: string;
  linkedEntityType?: 'list' | 'player' | 'game' | 'manual';
  linkedEntityId?: string;
  payload?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

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
