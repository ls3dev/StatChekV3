/**
 * NBA Future Draft Pick Assets (2026–2031)
 *
 * Static data file tracking which draft picks each NBA team owns,
 * has traded away, or has swap rights on.
 *
 * Sources:
 * - Hoops Rumors (hoopsrumors.com)
 * - RealGM (basketball.realgm.com)
 * - Pro Sports Transactions (prosportstransactions.com)
 *
 * Last updated: February 2026
 *
 * NOTE: This data changes with every trade. Update after major trades
 * or at the start of each season.
 */

export interface DraftPickAsset {
  year: number;
  round: 1 | 2;
  /** 'own' = team's own pick, 'acquired' = from another team, 'traded' = sent away, 'swap' = swap rights */
  type: 'own' | 'acquired' | 'traded' | 'swap';
  /** Team abbreviation this pick originally belongs to (if acquired/traded) */
  otherTeam?: string;
  /** Protection details */
  protection?: string;
  /** Additional context */
  notes?: string;
}

/**
 * Draft pick assets indexed by team ID (matching BDL team IDs 1-30)
 */
export const NBA_DRAFT_PICKS: Record<number, DraftPickAsset[]> = {
  // ==========================================
  // 1 - Atlanta Hawks (ATL)
  // ==========================================
  1: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'NOP', notes: 'Most favorable of MIL/NOP' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'MIL', protection: 'Top-4 protected', notes: 'Or NOP pick if less favorable' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 2 - Boston Celtics (BOS)
  // ==========================================
  2: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 3 - Brooklyn Nets (BKN)
  // ==========================================
  3: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'acquired', otherTeam: 'DET', notes: 'Least favorable of DET/MIL/ORL' },
    { year: 2027, round: 1, type: 'own', notes: 'Least favorable of BKN/HOU swap' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'NYK', notes: 'Unprotected (Mikal Bridges trade)' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'PHI', protection: 'Top-8 protected' },
    { year: 2028, round: 1, type: 'swap', otherTeam: 'NYK', notes: 'Most favorable of BKN/PHX/NYK' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2028, round: 2, type: 'acquired', otherTeam: 'MEM' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 1, type: 'acquired', otherTeam: 'NYK', notes: 'Unprotected (Mikal Bridges trade)' },
    { year: 2029, round: 1, type: 'acquired', otherTeam: 'DAL', notes: 'Least favorable of DAL/PHX/HOU' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2029, round: 2, type: 'acquired', otherTeam: 'DAL' },
    { year: 2029, round: 2, type: 'acquired', otherTeam: 'MEM' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 1, type: 'acquired', otherTeam: 'NYK', notes: 'Unprotected (Mikal Bridges trade)' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 4 - Charlotte Hornets (CHA)
  // ==========================================
  4: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 5 - Chicago Bulls (CHI)
  // ==========================================
  5: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'POR', protection: 'Top-14 protected' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 6 - Cleveland Cavaliers (CLE)
  // ==========================================
  6: [
    { year: 2026, round: 1, type: 'own', notes: 'Swap rights to UTA/ATL' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own', notes: 'May convey to UTA/MEM (Mitchell trade)' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'traded', otherTeam: 'UTA' },
    { year: 2029, round: 1, type: 'own', notes: 'May convey to UTA (Mitchell trade)' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 7 - Dallas Mavericks (DAL)
  // ==========================================
  7: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'OKC', notes: 'Least favorable of OKC/HOU/LAC' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'traded', otherTeam: 'NYK', notes: 'Traded in Luka-era deals' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own', notes: 'OKC has swap rights' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'traded', otherTeam: 'BKN' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 8 - Denver Nuggets (DEN)
  // ==========================================
  8: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own', notes: 'OKC has swap rights if 6-30' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 9 - Detroit Pistons (DET)
  // ==========================================
  9: [
    { year: 2026, round: 1, type: 'own', notes: 'Can swap with MIN (top-19 protected)' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2029, round: 2, type: 'acquired', otherTeam: 'MIL' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 10 - Golden State Warriors (GSW)
  // ==========================================
  10: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 11 - Houston Rockets (HOU)
  // ==========================================
  11: [
    { year: 2026, round: 1, type: 'own', protection: 'Top-4 protected', notes: 'If 5-30, goes to OKC/PHI/DAL' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own', notes: 'BKN has swap rights' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 12 - Indiana Pacers (IND)
  // ==========================================
  12: [
    { year: 2026, round: 1, type: 'traded', otherTeam: 'LAC', protection: 'Top-4, 10-30 protected', notes: 'If protected, owes 2031 1st instead' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own', notes: 'May owe to LAC if 2026 pick was protected' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 13 - LA Clippers (LAC)
  // ==========================================
  13: [
    { year: 2026, round: 1, type: 'traded', otherTeam: 'OKC', notes: 'Part of OKC/PHI/DAL pick conveyance' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'IND', protection: 'Top-4, 10-30 protected' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own', notes: 'OKC has swap rights' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 14 - Los Angeles Lakers (LAL)
  // ==========================================
  14: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'traded', otherTeam: 'MEM', protection: 'Top-4 protected', notes: 'JJJ trade via UTA' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 15 - Memphis Grizzlies (MEM)
  // ==========================================
  15: [
    // 2026
    { year: 2026, round: 1, type: 'own', notes: 'ORL has swap rights (Bane trade)' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'PHX', notes: 'More favorable of ORL/PHX (Bane trade)' },
    { year: 2026, round: 2, type: 'own' },
    // 2027
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'LAL', protection: 'Top-4 protected', notes: 'Via UTA (JJJ trade)' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'CLE', notes: 'Most favorable of CLE/MIN/UTA (JJJ trade)' },
    { year: 2027, round: 2, type: 'own' },
    // 2028
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'traded', otherTeam: 'BKN' },
    // 2029
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 1, type: 'swap', otherTeam: 'ORL', notes: 'Swap rights (Bane trade)' },
    { year: 2029, round: 2, type: 'traded', otherTeam: 'BKN' },
    // 2030
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 1, type: 'acquired', otherTeam: 'ORL', notes: 'Unprotected (Bane trade)' },
    { year: 2030, round: 2, type: 'own' },
    // 2031
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 1, type: 'acquired', otherTeam: 'PHX', notes: 'Unprotected (JJJ trade via UTA)' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 16 - Miami Heat (MIA)
  // ==========================================
  16: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 17 - Milwaukee Bucks (MIL)
  // ==========================================
  17: [
    // 2026
    { year: 2026, round: 1, type: 'own', notes: 'NOP has swap rights (Jrue Holiday trade)' },
    { year: 2026, round: 2, type: 'traded', otherTeam: 'ORL' },
    // 2027
    { year: 2027, round: 1, type: 'traded', otherTeam: 'ATL', protection: 'Top-4 protected', notes: 'Via NOP (Jrue Holiday trade)' },
    { year: 2027, round: 2, type: 'traded', otherTeam: 'PHI' },
    // 2028
    { year: 2028, round: 1, type: 'own', notes: 'POR and WAS have swap rights (Lillard/Middleton trades)' },
    { year: 2028, round: 2, type: 'traded', otherTeam: 'OKC' },
    // 2029
    { year: 2029, round: 1, type: 'traded', otherTeam: 'POR', notes: 'Unprotected (Lillard trade)' },
    { year: 2029, round: 2, type: 'traded', otherTeam: 'DET' },
    // 2030
    { year: 2030, round: 1, type: 'own', notes: 'POR has swap rights (Lillard trade)' },
    { year: 2030, round: 2, type: 'traded', otherTeam: 'ORL' },
    // 2031
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 18 - Minnesota Timberwolves (MIN)
  // ==========================================
  18: [
    { year: 2026, round: 1, type: 'own', notes: 'Swap rights to UTA/DET' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own', notes: 'May convey to UTA/MEM (Gobert trade)' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own', notes: 'May convey to UTA (Gobert trade)' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'traded', otherTeam: 'SAC' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 19 - New Orleans Pelicans (NOP)
  // ==========================================
  19: [
    { year: 2026, round: 1, type: 'traded', otherTeam: 'ATL', notes: 'Goes to ATL or MIL (swap scenario)' },
    { year: 2026, round: 1, type: 'swap', otherTeam: 'MIL', notes: 'Can swap with MIL pick' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 20 - New York Knicks (NYK)
  // ==========================================
  20: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'WAS', protection: 'Top-8 protected' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'traded', otherTeam: 'BKN', notes: 'Unprotected (Mikal Bridges trade)' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own', notes: 'BKN has swap rights (Bridges trade)' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'traded', otherTeam: 'BKN', notes: 'Unprotected (Mikal Bridges trade)' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'traded', otherTeam: 'BKN', notes: 'Unprotected (Mikal Bridges trade)' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 21 - Oklahoma City Thunder (OKC)
  // ==========================================
  21: [
    // 2026
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'UTA', protection: 'Top-8 protected' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'LAC', notes: 'Most favorable of OKC/HOU/LAC' },
    { year: 2026, round: 2, type: 'swap', otherTeam: 'DAL', notes: 'Swap of PHI 2nd' },
    // 2027
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 1, type: 'swap', otherTeam: 'LAC', notes: 'Swap rights' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'DEN', protection: 'Top-5 protected' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'SAS', protection: 'Top-16 protected' },
    { year: 2027, round: 2, type: 'swap', otherTeam: 'HOU', notes: 'Swap of HOU/IND/MIA' },
    // 2028
    { year: 2028, round: 1, type: 'swap', otherTeam: 'DAL', notes: 'Swap rights' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2028, round: 2, type: 'acquired', otherTeam: 'MIL' },
    { year: 2028, round: 2, type: 'acquired', otherTeam: 'UTA' },
    // 2029
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    // 2030
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    // 2031
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 22 - Orlando Magic (ORL)
  // ==========================================
  22: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 1, type: 'swap', otherTeam: 'MEM', notes: 'Swap rights (Bane trade)' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2026, round: 2, type: 'acquired', otherTeam: 'MIL' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own', notes: 'Traded to POR (via MEM reroute)' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own', notes: 'MEM has swap rights (Bane trade)' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'traded', otherTeam: 'MEM', notes: 'Unprotected (Bane trade)' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2030, round: 2, type: 'acquired', otherTeam: 'MIL' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 23 - Philadelphia 76ers (PHI)
  // ==========================================
  23: [
    { year: 2026, round: 1, type: 'traded', otherTeam: 'OKC', protection: 'Top-4 protected', notes: 'Rolled over from 2025' },
    { year: 2026, round: 1, type: 'acquired', otherTeam: 'OKC', notes: '2nd most favorable of OKC/HOU/LAC (McCain trade)' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own', notes: 'May owe to BKN (top-8 protected)' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2027, round: 2, type: 'acquired', otherTeam: 'MIL' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 24 - Phoenix Suns (PHX)
  // ==========================================
  24: [
    { year: 2026, round: 1, type: 'traded', otherTeam: 'MEM', notes: 'Part of WAS/MEM/CHA swap scenario' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own', notes: 'BKN has swap rights' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'traded', otherTeam: 'MEM', notes: 'Unprotected (via UTA, JJJ trade)' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 25 - Portland Trail Blazers (POR)
  // ==========================================
  25: [
    { year: 2026, round: 1, type: 'traded', otherTeam: 'CHI', protection: 'Top-14 protected' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 1, type: 'acquired', otherTeam: 'ORL', notes: 'Via MEM reroute' },
    { year: 2028, round: 1, type: 'swap', otherTeam: 'MIL', notes: 'Swap rights (Lillard trade)' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 1, type: 'acquired', otherTeam: 'MIL', notes: 'Unprotected (Lillard trade)' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 1, type: 'swap', otherTeam: 'MIL', notes: 'Swap rights (Lillard trade)' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 26 - Sacramento Kings (SAC)
  // ==========================================
  26: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'SAS', notes: 'Via LaVine three-team deal' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 1, type: 'acquired', otherTeam: 'MIN', notes: 'Via LaVine three-team deal' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 27 - San Antonio Spurs (SAS)
  // ==========================================
  27: [
    { year: 2026, round: 1, type: 'own', notes: 'Swap rights in multi-team scenario' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 1, type: 'traded', otherTeam: 'SAC', notes: 'Via LaVine three-team deal' },
    { year: 2027, round: 1, type: 'traded', otherTeam: 'OKC', protection: 'Top-16 protected' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 28 - Toronto Raptors (TOR)
  // ==========================================
  28: [
    { year: 2026, round: 1, type: 'own' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 29 - Utah Jazz (UTA)
  // ==========================================
  29: [
    // 2026
    { year: 2026, round: 1, type: 'own', notes: 'May owe to OKC (top-8 protected, Favors trade)' },
    { year: 2026, round: 2, type: 'own' },
    // 2027
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 1, type: 'acquired', otherTeam: 'MIN', notes: '2nd most favorable of UTA/MIN/CLE (Gobert trade)' },
    { year: 2027, round: 2, type: 'own' },
    // 2028
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2028, round: 2, type: 'acquired', otherTeam: 'CLE' },
    // 2029
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 1, type: 'acquired', otherTeam: 'CLE', notes: 'Most favorable of MIN/CLE (Mitchell trade)' },
    { year: 2029, round: 2, type: 'own' },
    // 2030
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    // 2031
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 1, type: 'acquired', otherTeam: 'PHX', notes: 'Unprotected (Pick swap with Suns)' },
    { year: 2031, round: 2, type: 'own' },
  ],

  // ==========================================
  // 30 - Washington Wizards (WAS)
  // ==========================================
  30: [
    { year: 2026, round: 1, type: 'traded', otherTeam: 'NYK', protection: 'Top-8 protected' },
    { year: 2026, round: 2, type: 'own' },
    { year: 2027, round: 1, type: 'own' },
    { year: 2027, round: 2, type: 'own' },
    { year: 2028, round: 1, type: 'own' },
    { year: 2028, round: 1, type: 'swap', otherTeam: 'MIL', notes: 'Swap rights (Middleton trade)' },
    { year: 2028, round: 2, type: 'own' },
    { year: 2029, round: 1, type: 'own' },
    { year: 2029, round: 2, type: 'own' },
    { year: 2030, round: 1, type: 'own' },
    { year: 2030, round: 2, type: 'own' },
    { year: 2031, round: 1, type: 'own' },
    { year: 2031, round: 2, type: 'own' },
  ],
};

/**
 * Get draft picks for a specific team, filtered to only show picks they HAVE
 * (own + acquired + swap rights) — excludes traded-away picks
 */
export function getTeamOwnedPicks(teamId: number): DraftPickAsset[] {
  const picks = NBA_DRAFT_PICKS[teamId] ?? [];
  return picks.filter((p) => p.type !== 'traded');
}

/**
 * Get draft picks that a team has TRADED AWAY
 */
export function getTeamTradedPicks(teamId: number): DraftPickAsset[] {
  const picks = NBA_DRAFT_PICKS[teamId] ?? [];
  return picks.filter((p) => p.type === 'traded');
}

/**
 * Get all picks for a team grouped by year
 */
export function getTeamPicksByYear(teamId: number): Record<number, { owned: DraftPickAsset[]; traded: DraftPickAsset[] }> {
  const picks = NBA_DRAFT_PICKS[teamId] ?? [];
  const byYear: Record<number, { owned: DraftPickAsset[]; traded: DraftPickAsset[] }> = {};

  for (const pick of picks) {
    if (!byYear[pick.year]) {
      byYear[pick.year] = { owned: [], traded: [] };
    }
    if (pick.type === 'traded') {
      byYear[pick.year].traded.push(pick);
    } else {
      byYear[pick.year].owned.push(pick);
    }
  }

  return byYear;
}
