"use client";

export interface AdvancedStats {
  season?: string;
  per?: number;
  ts_pct?: number;
  efg_pct?: number;
  usg_pct?: number;
  ows?: number;
  dws?: number;
  ws?: number;
  obpm?: number;
  dbpm?: number;
  bpm?: number;
  vorp?: number;
  ast_pct?: number;
  tov_pct?: number;
  orb_pct?: number;
  drb_pct?: number;
  trb_pct?: number;
  stl_pct?: number;
  blk_pct?: number;
}

const formatPct = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return (value * 100).toFixed(1);
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return value.toFixed(1);
};

const formatRating = (value?: number) => {
  if (value === undefined || value === null) return "-";
  const prefix = value > 0 ? "+" : "";
  return prefix + value.toFixed(1);
};

function GridStat({
  label,
  value,
  isPositive,
  isNegative,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
  isNegative?: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[56px]">
      <span
        className={`text-base font-bold tabular-nums ${
          isPositive
            ? "text-green-400"
            : isNegative
              ? "text-red-400"
              : "text-text-primary"
        }`}
      >
        {value}
      </span>
      <span className="text-[10px] text-text-muted mt-0.5">{label}</span>
    </div>
  );
}

interface AdvancedStatsSectionProps {
  stats: AdvancedStats | null;
  isLoading?: boolean;
}

export function AdvancedStatsSection({
  stats,
  isLoading = false,
}: AdvancedStatsSectionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-text-muted">
          Loading advanced stats...
        </span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <svg
          className="w-8 h-8 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="text-sm text-text-muted">
          Advanced stats not available
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Efficiency */}
      <div>
        <p className="text-[11px] font-bold text-text-muted tracking-wider mb-1.5">
          EFFICIENCY
        </p>
        <div className="flex justify-around py-2">
          <GridStat label="PER" value={formatNumber(stats.per)} />
          <GridStat label="TS%" value={formatPct(stats.ts_pct)} />
          <GridStat label="USG%" value={formatNumber(stats.usg_pct)} />
        </div>
      </div>

      {/* Win Shares (shown only when available - BBRef source) */}
      {(stats.ws !== undefined || stats.ows !== undefined || stats.dws !== undefined) && (
        <div>
          <p className="text-[11px] font-bold text-text-muted tracking-wider mb-1.5">
            WIN SHARES
          </p>
          <div className="flex justify-around py-2">
            <GridStat label="WS" value={formatNumber(stats.ws)} />
            <GridStat label="OWS" value={formatNumber(stats.ows)} />
            <GridStat label="DWS" value={formatNumber(stats.dws)} />
          </div>
        </div>
      )}

      {/* Box Plus/Minus (shown only when available - BBRef source) */}
      {(stats.bpm !== undefined || stats.obpm !== undefined || stats.vorp !== undefined) && (
        <div>
          <p className="text-[11px] font-bold text-text-muted tracking-wider mb-1.5">
            BOX PLUS/MINUS
          </p>
          <div className="flex justify-around py-2">
            <GridStat
              label="BPM"
              value={formatRating(stats.bpm)}
              isPositive={(stats.bpm ?? 0) > 0}
              isNegative={(stats.bpm ?? 0) < 0}
            />
            <GridStat
              label="OBPM"
              value={formatRating(stats.obpm)}
              isPositive={(stats.obpm ?? 0) > 0}
              isNegative={(stats.obpm ?? 0) < 0}
            />
            <GridStat
              label="DBPM"
              value={formatRating(stats.dbpm)}
              isPositive={(stats.dbpm ?? 0) > 0}
              isNegative={(stats.dbpm ?? 0) < 0}
            />
            <GridStat label="VORP" value={formatNumber(stats.vorp)} />
          </div>
        </div>
      )}

      {/* Rates */}
      <div>
        <p className="text-[11px] font-bold text-text-muted tracking-wider mb-1.5">
          RATES
        </p>
        <div className="flex justify-around py-2">
          <GridStat label="AST%" value={formatNumber(stats.ast_pct)} />
          <GridStat label="TOV%" value={formatNumber(stats.tov_pct)} />
          <GridStat label="TRB%" value={formatNumber(stats.trb_pct)} />
        </div>
      </div>

      {/* Defense */}
      <div>
        <p className="text-[11px] font-bold text-text-muted tracking-wider mb-1.5">
          DEFENSE
        </p>
        <div className="flex justify-around py-2">
          <GridStat label="STL%" value={formatNumber(stats.stl_pct)} />
          <GridStat label="BLK%" value={formatNumber(stats.blk_pct)} />
          <GridStat label="ORB%" value={formatNumber(stats.orb_pct)} />
          <GridStat label="DRB%" value={formatNumber(stats.drb_pct)} />
        </div>
      </div>
    </div>
  );
}
