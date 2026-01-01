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
};

export type PlayerList = {
  id: string;
  name: string;
  description?: string;
  players: Player[];
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


