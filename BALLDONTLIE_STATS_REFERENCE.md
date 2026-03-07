# BallDontLie Stats Reference

Purpose: persistent in-repo reference so future AI/code agents know which BallDontLie stats endpoints are available.

## Notes

- Current repo does not contain an MCP server config for BallDontLie.
- Existing integration uses direct API calls via Convex clients in:
  - `packages/convex/convex/lib/balldontlie.ts`
  - `apps/web/convex/lib/balldontlie.ts`

## Team Stats Endpoint

- Endpoint pattern:
  - `GET /nba/v1/team_season_averages/{category}`
- Typical query params:
  - `season`
  - `type` (required for most categories)
  - `team_ids[]` (optional filter)

### Team categories and types

- `general`: `base`, `advanced`, `scoring`, `misc`, `opponent`, `defense`, `violations`
- `clutch`: `base`, `advanced`, `misc`, `scoring`
- `shooting`: `by_zone_base`, `by_zone_opponent`, `5ft_range_base`, `5ft_range_opponent`
- `playtype`: `cut`, `handoff`, `isolation`, `offrebound`, `offscreen`, `postup`, `prballhandler`, `prrollman`, `spotup`, `transition`, `misc`
- `tracking`: `painttouch`, `efficiency`, `speeddistance`, `defense`, `elbowtouch`, `posttouch`, `passing`, `drives`, `rebounding`, `catchshoot`, `pullupshot`, `possessions`
- `hustle`: no `type`
- `shotdashboard`: `overall`, `pullups`, `catch_and_shoot`, `less_than_10_ft`

### Team basic stats (example: `category=general&type=base`)

Common stat keys include:

- `pts`, `reb`, `ast`
- `oreb`, `dreb`
- `stl`, `blk`
- `fgm`, `fga`, `fg_pct`
- `fg3m`, `fg3a`, `fg3_pct`
- `ftm`, `fta`, `ft_pct`
- `tov`, `pf`, `pfd`, `blka`
- `w`, `l`, `gp`, `w_pct`
- `plus_minus`, `min`

## Player Stats Endpoint

- Endpoint pattern:
  - `GET /nba/v1/season_averages/{category}`
- Typical query params:
  - `season`
  - `type` (required for most categories)
  - `player_ids[]` (optional filter)

### Player categories and types

- `general`: `base`, `advanced`, `usage`, `scoring`, `defense`, `misc`
- `clutch`: `base`, `advanced`, `usage`, `scoring`, `misc`
- `defense`: `overall`, `2_pointers`, `3_pointers`, `less_than_6ft`, `less_than_10ft`, `greater_than_15ft`
- `shooting`: `by_zone`, `5ft_range`
- `playtype`: `cut`, `handoff`, `isolation`, `offrebound`, `offscreen`, `postup`, `prballhandler`, `prrollman`, `spotup`, `transition`, `misc`
- `tracking`: `painttouch`, `efficiency`, `speeddistance`, `defense`, `elbowtouch`, `posttouch`, `passing`, `drives`, `rebounding`, `catchshoot`, `pullupshot`, `possessions`
- `hustle`: no `type`
- `shotdashboard`: `overall`, `pullups`, `catch_and_shoot`, `less_than_10_ft`

### Player basic stats (example: `category=general&type=base`)

For PPG/RPG/APG style metrics, use `stats.pts`, `stats.reb`, `stats.ast`.

## Integration Reminder for This Repo

- Team detail screen currently fetches:
  - `api.nba.getGames`
  - `api.nba.getTeamContracts`
  - `api.nba.getInjuries`
- It does not yet call a team season averages action.
- If you need team PPG/RPG on `/team/[id]`, add a new Convex action that calls the team season averages endpoint and return normalized stats to mobile.
