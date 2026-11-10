import React from 'react';
import { Map, Kanban, Navigation, CheckCircle2, Search, Store, ShieldCheck, Wrench, Briefcase } from 'lucide-react';
import { CrmProfile, UserRole } from '../types/crm';

interface NavbarProps {
  currentTab: 'map' | 'pipeline' | 'route' | 'pos_queue';
  onTabChange: (tab: 'map' | 'pipeline' | 'route' | 'pos_queue') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  profiles: CrmProfile[];
  currentProfile: CrmProfile | null;
  onProfileChange: (profile: CrmProfile) => void;
  posQueueCount: number;
  totalLeadsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  profiles,
  currentProfile,
  onProfileChange,
  posQueueCount,
  totalLeadsCount,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Stats */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">SPOONFUL</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                  Sales CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-slate-300 font-semibold">{totalLeadsCount}</span> restaurants in Enschede
              </p>
            </div>
          </div>

          {/* Mobile Profile Selector */}
          <div className="md:hidden">
            <select
              value={currentProfile?.id || ''}
              onChange={(e) => {
                const found = profiles.find(p => p.id === e.target.value);
                if (found) onProfileChange(found);
              }}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 overflow-x-auto max-w-full">
          <button
            onClick={() => onTabChange('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'map'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Field Map
          </button>

          <button
            onClick={() => onTabChange('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'pipeline'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Pipeline
          </button>

          <button
            onClick={() => onTabChange('route')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'route'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Daily Route & GPS
          </button>

          <button
            onClick={() => onTabChange('pos_queue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap relative ${
              currentTab === 'pos_queue'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Oleksandr's POS Queue
            {posQueueCount > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse ml-1">
                {posQueueCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Desktop Profile Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search restaurant, cuisine..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/80 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-500"
            />
          </div>

          <div className="hidden md:flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
              {currentProfile?.name.charAt(0) || 'U'}
            </div>
            <div className="text-left text-xs">
              <div className="font-semibold text-slate-200 leading-tight">
                {currentProfile?.name.split(' ')[0] || 'User'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight capitalize">
                {currentProfile?.role === 'pos_installer' ? 'POS Specialist' : currentProfile?.role}
              </div>
            </div>
            <select
              value={currentProfile?.id || ''}
              onChange={(e) => {
                const found = profiles.find(p => p.id === e.target.value);
                if (found) onProfileChange(found);
              }}
              className="bg-transparent text-slate-400 text-xs hover:text-white cursor-pointer focus:outline-none pl-1"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

