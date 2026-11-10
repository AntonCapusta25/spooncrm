import React from 'react';
import { 
  Map, Kanban, Table2, Wrench, Navigation, Search, 
  Filter, Plus, Share2, Sparkles, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import { CrmProfile } from '../types/crm';

interface NavbarProps {
  currentTab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue';
  onTabChange: (tab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  posQueueCount: number;
  totalLeadsCount: number;
  onNewLeadClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  posQueueCount,
  totalLeadsCount,
  onNewLeadClick,
}) => {
  return (
    <header className="bg-white border-b border-[#EDEDEB] sticky top-0 z-30 select-none">
      
      {/* Top Title & Action Bar */}
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">📍</span>
          <div>
            <h1 className="text-base font-bold text-[#37352F] tracking-tight flex items-center gap-2">
              <span>Enschede Field Operations</span>
              <span className="text-[11px] font-normal text-[#787774] bg-[#F7F6F3] border border-[#EDEDEB] px-2 py-0.5 rounded-md">
                {totalLeadsCount} restaurants
              </span>
            </h1>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 md:w-64">
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
            className="flex items-center gap-1.5 bg-[#FF5A1F] hover:bg-[#E04B14] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Database View Tabs (Notion signature database views) */}
      <div className="px-6 flex items-center gap-1 border-t border-[#EDEDEB] overflow-x-auto text-[13px]">
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
              ? 'border-[#D44026] text-[#D44026] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352F] hover:bg-[#F7F6F3]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Oleksandr's Dispatch</span>
          {posQueueCount > 0 && (
            <span className="bg-[#FFE2DD] text-[#D44026] text-[11px] font-bold px-1.5 py-0.2 rounded">
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
