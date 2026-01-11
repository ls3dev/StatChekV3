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
