import React from 'react';
import { Map, Kanban, Wrench, Table2, Navigation } from 'lucide-react';

interface MobileTabBarProps {
  currentTab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue';
  onTabChange: (tab: 'map' | 'pipeline' | 'table' | 'route' | 'pos_queue') => void;
  posQueueCount: number;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentTab,
  onTabChange,
  posQueueCount,
}) => {
  const tabs = [
    { id: 'map' as const, label: 'Radar', icon: Map },
    { id: 'pipeline' as const, label: 'Board', icon: Kanban },
    { 
      id: 'pos_queue' as const, 
      label: 'POS', 
      icon: Wrench,
      badge: posQueueCount > 0 ? posQueueCount : null
    },
    { id: 'table' as const, label: 'Table', icon: Table2 },
    { id: 'route' as const, label: 'Route', icon: Navigation },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDEDEB] pb-safe"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative min-h-[44px] transition-colors ${
                isActive ? 'text-[#37352F]' : 'text-[#9B9A97] hover:text-[#787774]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D44026] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-[#37352F]' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-[#37352F] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
