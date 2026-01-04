import { MoreVertical, Star } from 'lucide-react';
import React, { useState } from 'react';

export default function PlayByPlay() {
  const [activeTab, setActiveTab] = useState('play-by-play');
  const [playFilter, setPlayFilter] = useState('key');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white">
      {/* Match Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🦅</span>
            </div>
            <span className="text-4xl font-bold">0</span>
          </div>

          {/* Time */}
          <div className="text-center">
            <p className="text-xl font-semibold">89:40</p>
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold">2</span>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🦁</span>
            </div>
            <Star size={20} className="fill-white" />
            <button className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 bg-black/20 backdrop-blur-sm rounded-full p-1">
          <TabButton 
            label="Stats" 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
          />
          <TabButton 
            label="Play-By-Play" 
            active={activeTab === 'play-by-play'} 
            onClick={() => setActiveTab('play-by-play')} 
          />
          <TabButton 
            label="Rankings" 
            active={activeTab === 'rankings'} 
            onClick={() => setActiveTab('rankings')} 
          />
        </div>
      </div>

      {/* Play Filter */}
      <div className="px-4 mb-6">
        <div className="flex gap-3">
          <FilterButton 
            label="All Plays" 
            active={playFilter === 'all'} 
            onClick={() => setPlayFilter('all')} 
          />
          <FilterButton 
            label="Key Plays" 
            active={playFilter === 'key'} 
            onClick={() => setPlayFilter('key')} 
          />
        </div>
      </div>

      {/* Play-by-Play List */}
      <div className="px-4 space-y-3 pb-20">
        <PlayItem 
          text="Enzo Fernández scores with a right foot shot."
          time="87:55"
          score="0 · 2"
          isKeyPlay
          teamSide="home"
        />
        <PlayItem 
          text="Josh Laurent replaces Florentino."
          time="83:16"
          teamSide="away"
        />
        <PlayItem 
          text="Jacob Bruun Larsen replaces Loum Tchaouna."
          time="75:37"
          teamSide="away"
        />
        <PlayItem 
          text="Marc Guiu replaces Joao Pedro."
          time="75:21"
          teamSide="home"
        />
        <PlayItem 
          text="Armando Broja replaces Zian Flemming."
          time="71:36"
          teamSide="away"
        />
        <PlayItem 
          text="Hannibal Mejbri replaces Lesley Ugochukwu."
          time="71:29"
          teamSide="away"
        />
        <PlayItem 
          text="Lyle Foster replaces Jaidon Anthony."
          time="71:23"
          teamSide="away"
        />
        <PlayItem 
          text="Malo Gusto replaces Liam Delap."
          time="71:15"
          teamSide="home"
        />
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
        active 
          ? 'bg-white/20 text-white' 
          : 'text-white/60 hover:text-white/80'
      }`}
    >
      {label}
    </button>
  );
}

function FilterButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-6 rounded-2xl text-base font-medium transition-all ${
        active 
          ? 'bg-white/25 backdrop-blur-sm text-white' 
          : 'bg-black/20 backdrop-blur-sm text-white/70'
      }`}
    >
      {label}
    </button>
  );
}

function PlayItem({ text, time, score, isKeyPlay, teamSide }) {
  // Determine background based on team side and if it's a key play
  const getBgColor = () => {
    if (isKeyPlay && teamSide === 'home') {
      return 'bg-blue-900/40';
    } else if (isKeyPlay && teamSide === 'away') {
      return 'bg-purple-900/40';
    }
    return 'bg-black/30';
  };

  // Determine border color based on team side
  const getBorderColor = () => {
    if (teamSide === 'home') return 'border-l-blue-500';
    if (teamSide === 'away') return 'border-l-pink-500';
    return 'border-l-transparent';
  };

  return (
    <div 
      className={`${getBgColor()} backdrop-blur-sm rounded-2xl p-5 border-l-4 ${getBorderColor()}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-white text-base leading-relaxed pr-4">{text}</p>
        {score && (
          <span className="text-white/60 text-sm font-medium whitespace-nowrap ml-2">
            {score}
          </span>
        )}
      </div>
      <p className="text-white/50 text-sm mt-2">{time}</p>
    </div>
  );
}