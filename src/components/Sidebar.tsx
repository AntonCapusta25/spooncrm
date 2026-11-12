import React from 'react';
import { 
  Map, Kanban, Table2, Wrench, Navigation, 
  Flame, X, Inbox, Sparkles, ExternalLink
} from 'lucide-react';
import { CrmProfile } from '../types/crm';

interface SidebarProps {
  currentTab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue' | 'applications';
  onTabChange: (tab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue' | 'applications') => void;
  currentProfile: CrmProfile | null;
  posQueueCount: number;
  applicationsCount?: number;
  totalLeadsCount: number;
  selectedDistrict: string;
  onDistrictSelect: (district: string) => void;
  onLogout: () => void;
  onOpenOnboardingFlow?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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
  applicationsCount = 0,
  totalLeadsCount,
  selectedDistrict,
  onDistrictSelect,
  onLogout,
  onOpenOnboardingFlow,
  mobileOpen = false,
  onMobileClose
}) => {
  const handleItemClick = (tab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue' | 'applications') => {
    onTabChange(tab);
    onMobileClose?.();
  };

  const handleDistrictClick = (code: string) => {
    onDistrictSelect(code);
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 md:static md:z-auto
        w-72 md:w-64 h-[100dvh] bg-[#F7F6F3] border-r border-[#EDEDEB] 
        flex flex-col justify-between shrink-0 select-none text-[#37352F] text-[13px]
        pt-safe pb-safe transition-transform duration-200 ease-out
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Top Section */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Workspace Brand Header */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#EFEFED]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-5 h-5 rounded bg-[#FF5A1F] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
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

            <button
              onClick={onMobileClose}
              className="md:hidden p-1 rounded hover:bg-[#E3E2E0] text-[#787774] hover:text-[#37352F]"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Callout: Oleksandr's POS Handover Alert */}
          {posQueueCount > 0 && (
            <div
              onClick={() => handleItemClick('pos_queue')}
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
            <div className="px-2 py-1 text-[11px] font-medium text-[#787774] tracking-wider uppercase flex items-center justify-between">
              <span>Views</span>
            </div>

            <button
              onClick={() => handleItemClick('applications')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
                currentTab === 'applications'
                  ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                  : 'text-[#5A5852] hover:bg-[#EFEFED]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#FF5A1F]" />
                <span className="font-medium">Applications</span>
              </div>
              {applicationsCount > 0 ? (
                <span className="bg-[#FFF1EB] text-[#FF5A1F] border border-[#FF5A1F]/30 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {applicationsCount}
                </span>
              ) : (
                <span className="text-[10px] text-[#9B9A97]">0</span>
              )}
            </button>

            <button
              onClick={() => handleItemClick('map')}
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
              onClick={() => handleItemClick('pipeline')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
                currentTab === 'pipeline'
                  ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                  : 'text-[#5A5852] hover:bg-[#EFEFED]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Kanban className="w-4 h-4 text-[#787774]" />
                <span>Board View</span>
              </div>
            </button>

            <button
              onClick={() => handleItemClick('table')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors ${
                currentTab === 'table'
                  ? 'bg-[#EFEFED] font-semibold text-[#37352F]'
                  : 'text-[#5A5852] hover:bg-[#EFEFED]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-[#787774]" />
                <span>Table View</span>
              </div>
            </button>

            <button
              onClick={() => handleItemClick('pos_queue')}
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
                <span className="bg-[#FFE2DD] text-[#D44026] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {posQueueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleItemClick('route')}
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
                  onClick={() => handleDistrictClick(d.code)}
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

          {/* Onboarding Flow Launcher Card */}
          {onOpenOnboardingFlow && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onOpenOnboardingFlow();
                  onMobileClose?.();
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-tr from-[#FFF1EB] to-[#FFF8F5] border border-[#FED7AA] hover:border-[#FF5A1F] text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C2410C] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    Typeform Flow
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#FF5A1F] opacity-70 group-hover:opacity-100" />
                </div>
                <p className="text-[11px] text-[#787774] mt-1 leading-snug">
                  Open public restaurant onboarding flow
                </p>
              </button>
            </div>
          )}

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
    </>
  );
};
