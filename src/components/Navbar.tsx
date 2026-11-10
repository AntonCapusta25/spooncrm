import React from 'react';
import { 
  Map, Kanban, Table2, Wrench, Navigation, Search, 
  Plus, Menu
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue';
  onTabChange: (tab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  posQueueCount: number;
  totalLeadsCount: number;
  onNewLeadClick: () => void;
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  posQueueCount,
  totalLeadsCount,
  onNewLeadClick,
  onMenuClick,
}) => {
  return (
    <header className="bg-white border-b border-[#EDEDEB] sticky top-0 z-30 select-none pt-safe">
      
      {/* Top Title & Action Bar */}
      <div className="px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-2 md:gap-4">
        
        {/* Mobile Hamburger + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-[#F7F6F3] text-[#37352F] shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-lg md:text-xl shrink-0">📍</span>
          
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold text-[#37352F] tracking-tight flex items-center gap-1.5 md:gap-2 truncate">
              <span className="truncate">Enschede Ops</span>
              <span className="text-[10px] md:text-[11px] font-normal text-[#787774] bg-[#F7F6F3] border border-[#EDEDEB] px-1.5 py-0.5 rounded-md shrink-0">
                {totalLeadsCount}
              </span>
            </h1>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <div className="relative w-32 sm:w-48 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9B9A97]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#F7F6F3] hover:bg-[#EFEFED] focus:bg-white text-xs text-[#37352F] pl-8 pr-2.5 py-1.5 rounded-md border border-transparent focus:border-[#D4D4D0] focus:outline-none placeholder-[#9B9A97] transition-all"
            />
          </div>

          <button
            onClick={onNewLeadClick}
            className="flex items-center gap-1 bg-[#FF5A1F] hover:bg-[#E04B14] text-white text-xs font-semibold px-2.5 md:px-3 py-1.5 rounded-md shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Database View Tabs (Visible on Desktop, replaced by bottom bar on Mobile) */}
      <div className="hidden md:flex px-6 items-center gap-1 border-t border-[#EDEDEB] overflow-x-auto text-[13px]">
        <button
          onClick={() => onTabChange('map')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
            currentTab === 'map'
              ? 'border-[#37352F] text-[#37352F] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Map Radar</span>
        </button>

        <button
          onClick={() => onTabChange('pipeline')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
            currentTab === 'pipeline'
              ? 'border-[#37352F] text-[#37352F] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Board View</span>
        </button>

        <button
          onClick={() => onTabChange('table')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
            currentTab === 'table'
              ? 'border-[#37352F] text-[#37352F] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          <span>Table View</span>
        </button>

        <button
          onClick={() => onTabChange('pos_queue')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
            currentTab === 'pos_queue'
              ? 'border-[#37352F] text-[#37352F] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Oleksandr's Dispatch</span>
          {posQueueCount > 0 && (
            <span className="bg-[#FFE2DD] text-[#D44026] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {posQueueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('route')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
            currentTab === 'route'
              ? 'border-[#37352F] text-[#37352F] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Daily Route & GPS</span>
        </button>
      </div>

    </header>
  );
};
