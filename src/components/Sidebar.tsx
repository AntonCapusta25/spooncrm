import React from 'react';
import { 
  Map, Kanban, Table2, Wrench, Navigation, Search, 
  ChevronDown, Flame, Compass, ChevronRight, User, Settings,
  CheckCircle2, Plus, Sparkles
} from 'lucide-react';
import { CrmProfile } from '../types/crm';

interface SidebarProps {
  currentTab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue';
  onTabChange: (tab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue') => void;
  currentProfile: CrmProfile | null;
  posQueueCount: number;
  totalLeadsCount: number;
  selectedDistrict: string;
  onDistrictSelect: (district: string) => void;
  onLogout: () => void;
}

const DISTRICTS = [
  { code: 'all', name: 'All Enschede', count: 834 },
  { code: '7511', name: 'Centrum / Oude Markt', count: 257 },
  { code: '7512', name: 'De Brink / Veldkamp', count: 64 },
  { code: '7513', name: 'Waldeck / Stadsveld', count: 42 },
  { code: '7521', name: 'Twekkelerveld', count: 58 },
  { code: '7522', name: 'Bolhaar / Roessingh', count: 35 },
  { code: '7531', name: 'Glanerbrug West', count: 29 },
  { code: '7534', name: 'Eschmarke / Glanerbrug', count: 38 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentProfile,
  posQueueCount,
  totalLeadsCount,
  selectedDistrict,
  onDistrictSelect,
  onLogout
}) => {
  return (
    <aside className="w-64 h-screen bg-[#F7F6F3] border-r border-[#EDEDEB] flex flex-col justify-between shrink-0 select-none text-[#37352F] text-[13px]">
      
      {/* Top Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Workspace Brand Header */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[#EFEFED]">
          <div className="w-5 h-5 rounded bg-[#FF5A1F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            🥄
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-xs tracking-tight text-[#37352F] block truncate">
              Spoonful Workspace
            </span>
            <span className="text-[10px] text-[#787774] block truncate">
              Enschede Operations
            </span>
          </div>
        </div>

        {/* Action Callout: Oleksandr's POS Handover Alert */}
        {posQueueCount > 0 && (
          <div
            onClick={() => onTabChange('pos_queue')}
            className={`px-2.5 py-2 rounded-lg cursor-pointer transition-all border ${
              currentTab === 'pos_queue'
                ? 'bg-[#FFE2DD] border-[#F5C0B8] text-[#D44026]'
                : 'bg-[#FFF8F7] border-[#FFE2DD] text-[#D44026] hover:bg-[#FFE2DD]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-[#D44026]" />
                POS Handover Queue
              </span>
              <span className="bg-[#D44026] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {posQueueCount}
              </span>
            </div>
            <p className="text-[11px] text-[#787774] mt-0.5">
              Ready for hardware delivery & proof
            </p>
          </div>
        )}

        {/* Database Views Navigation */}
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[11px] font-medium text-[#787774] tracking-wider uppercase">
            Views
          </div>

          <button
            onClick={() => onTabChange('map')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
              currentTab === 'map'
                ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                : 'text-[#5A5852] hover:bg-[#EFEFED]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-[#787774]" />
              <span>Map Radar</span>
            </div>
            <span className="text-[11px] font-mono text-[#9B9A97]">{totalLeadsCount}</span>
          </button>

          <button
            onClick={() => onTabChange('pipeline')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
              currentTab === 'pipeline'
                ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                : 'text-[#5A5852] hover:bg-[#EFEFED]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Kanban className="w-4 h-4 text-[#787774]" />
              <span>Pipeline Board</span>
            </div>
          </button>

          <button
            onClick={() => onTabChange('table')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
              currentTab === 'table'
                ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                : 'text-[#5A5852] hover:bg-[#EFEFED]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-[#787774]" />
              <span>Prospects Table</span>
            </div>
          </button>

          <button
            onClick={() => onTabChange('pos_queue')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
              currentTab === 'pos_queue'
                ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                : 'text-[#5A5852] hover:bg-[#EFEFED]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#787774]" />
              <span>Oleksandr's Dispatch</span>
            </div>
            {posQueueCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 rounded bg-[#FFE2DD] text-[#D44026]">
                {posQueueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('route')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
              currentTab === 'route'
                ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                : 'text-[#5A5852] hover:bg-[#EFEFED]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#787774]" />
              <span>Daily Route & GPS</span>
            </div>
          </button>
        </div>

        {/* Districts Filter Section */}
        <div className="space-y-0.5 pt-2">
          <div className="px-2 py-1 text-[11px] font-medium text-[#787774] tracking-wider uppercase flex items-center justify-between">
            <span>Enschede Districts</span>
          </div>

          <div className="space-y-0.5">
            {DISTRICTS.map((d) => (
              <button
                key={d.code}
                onClick={() => onDistrictSelect(d.code)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors ${
                  selectedDistrict === d.code
                    ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                    : 'text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F]'
                }`}
              >
                <span className="truncate">{d.name}</span>
                <span className="text-[10px] font-mono text-[#9B9A97]">{d.count}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Profile Bar */}
      <div className="p-3 border-t border-[#EDEDEB] bg-[#F7F6F3]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[#EFEFED]">
          <div className="w-6 h-6 rounded-full bg-[#E3E2E0] flex items-center justify-center font-bold text-xs text-[#37352F]">
            {currentProfile?.name.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[#37352F] truncate">
              {currentProfile?.name || 'Spoonful Team'}
            </div>
            <div className="text-[10px] text-[#787774] capitalize">
              {currentProfile?.role === 'pos_installer' ? 'POS Specialist' : currentProfile?.role}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-2 text-center text-[11px] font-medium text-[#787774] hover:text-[#D44026] hover:bg-[#FFE2DD] py-1 rounded transition-colors"
        >
          Sign out
        </button>
      </div>

    </aside>
  );
};

