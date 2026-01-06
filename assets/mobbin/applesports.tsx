import { Share2, Star } from 'lucide-react';
import React from 'react';

export default function SportsApp() {
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl font-bold text-gray-800">🍎 Sports</span>
        </div>
        <div className="flex gap-6">
          <button className="text-xl font-semibold">Today</button>
          <button className="text-xl text-gray-600">Premier League</button>
        </div>
      </div>

      {/* Match Card */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-3xl p-6 relative overflow-hidden">
          {/* Drag Handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-500 rounded-full"></div>
          
          {/* Share Button */}
          <button className="absolute top-4 right-4 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
            <Share2 size={20} />
          </button>

          {/* League Title */}
          <p className="text-center text-gray-300 text-sm mb-8 mt-4">Premier League</p>

          {/* Teams */}
          <div className="flex items-center justify-between mb-8">
            {/* Liverpool */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <Star size={16} className="text-white fill-white" />
              <div className="w-20 h-20 flex items-center justify-center">
                <div className="text-6xl">🦅</div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Liverpool</p>
                <p className="text-gray-400 text-sm">6-0-5</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex-shrink-0 px-6">
              <p className="text-2xl font-bold whitespace-nowrap">10:00 PM</p>
            </div>

            {/* Nottm Forest */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-4 h-4"></div>
              <div className="w-20 h-20 flex items-center justify-center">
                <div className="text-6xl">🌲</div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Nott'm Forest</p>
                <p className="text-gray-400 text-sm">2-3-6</p>
              </div>
            </div>
          </div>

          {/* Following Button */}
          <button className="w-full bg-gray-700/60 backdrop-blur-sm rounded-full py-3 px-6 flex items-center justify-center gap-2 mb-4">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-full"></div>
            </div>
            <span className="font-semibold">Following</span>
          </button>

          {/* Broadcast Info */}
          <p className="text-center text-gray-400 text-sm">Watch on NBC Sports, Peacock</p>
        </div>
      </div>

      {/* Betting Odds */}
      <div className="px-4 mb-6">
        <div className="bg-gray-900 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-4">Betting Odds</h3>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-2xl font-bold">LIV 1.42</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">Draw 4.90</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">NFO 7.00</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            Odds Provided by <span className="font-semibold">DRAFTKINGS</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="px-4 mb-6">
        <div className="bg-gray-900 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-4">Table</h3>
          
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_40px_40px_40px_40px_50px_50px] gap-2 text-gray-500 text-xs mb-3 px-2">
            <div></div>
            <div>Team</div>
            <div className="text-center">P</div>
            <div className="text-center">W</div>
            <div className="text-center">D</div>
            <div className="text-center">L</div>
            <div className="text-center">GD</div>
            <div className="text-center">PTS</div>
          </div>

          {/* Table Rows */}
          <TableRow rank="1" team="Arsenal" logo="🔴" star played="11" wins="8" draws="2" losses="1" gd="+15" pts="26" />
          <TableRow rank="2" team="Man City" logo="⚪" played="11" wins="7" draws="1" losses="3" gd="+15" pts="22" />
          <TableRow rank="3" team="Chelsea" logo="🔵" star played="11" wins="6" draws="2" losses="3" gd="+10" pts="20" />
          <TableRow rank="4" team="Sunderland" logo="🔴" played="11" wins="5" draws="4" losses="2" gd="+4" pts="19" />
          <TableRow rank="5" team="Spurs" logo="⚪" played="11" wins="5" draws="3" losses="3" gd="+9" pts="18" />
          <TableRow rank="6" team="Aston Villa" logo="🟣" played="11" wins="5" draws="3" losses="3" gd="+3" pts="18" />
          <TableRow rank="7" team="Man United" logo="🔴" star played="11" wins="5" draws="3" losses="3" gd="+1" pts="18" />
          <TableRow rank="8" team="Liverpool" logo="🔴" star highlight played="11" wins="6" draws="0" losses="5" gd="+1" pts="18" />
        </div>
      </div>
    </div>
  );
}

function TableRow({ rank, team, logo, star, highlight, played, wins, draws, losses, gd, pts }) {
  return (
    <div className={`grid grid-cols-[40px_1fr_40px_40px_40px_40px_50px_50px] gap-2 items-center py-3 px-2 rounded-lg ${highlight ? 'bg-gray-800' : ''}`}>
      <div className="text-gray-400 text-sm">{rank}</div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{logo}</span>
        <span className={highlight ? 'font-bold' : ''}>
          {team} {star && <Star size={12} className="inline fill-white" />}
        </span>
      </div>
      <div className="text-center text-sm">{played}</div>
      <div className="text-center text-sm">{wins}</div>
      <div className="text-center text-sm">{draws}</div>
      <div className="text-center text-sm">{losses}</div>
      <div className="text-center text-sm">{gd}</div>
      <div className="text-center font-semibold">{pts}</div>
    </div>
  );
}