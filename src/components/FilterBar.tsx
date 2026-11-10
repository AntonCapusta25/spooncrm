import React from 'react';
import { Filter, X, Phone, Camera, Star, User, Layers, RotateCcw } from 'lucide-react';
import { CrmProfile, LeadStage } from '../types/crm';

export interface FilterState {
  stage: string;
  cuisine: string;
  assigneeId: string;
  minRating: number;
  hasPhone: boolean;
  hasProof: boolean;
  district: string;
  search: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  profiles: CrmProfile[];
  totalLeadsCount: number;
  filteredCount: number;
  cuisines: string[];
}

const STAGES: { value: string; label: string; bg: string; text: string }[] = [
  { value: 'all', label: 'All Stages', bg: 'bg-[#E3E2E0]', text: 'text-[#5A5852]' },
  { value: 'discovered', label: 'Discovered', bg: 'bg-[#E3E2E0]', text: 'text-[#5A5852]' },
  { value: 'contacted', label: 'Contacted', bg: 'bg-[#D3E5EF]', text: 'text-[#1879B5]' },
  { value: 'meeting_scheduled', label: 'Meeting', bg: 'bg-[#E8DEEE]', text: 'text-[#8232B4]' },
  { value: 'contract_signed', label: 'Signed', bg: 'bg-[#DBEDDB]', text: 'text-[#286E34]' },
  { value: 'pos_handover', label: '⚡ POS Handover', bg: 'bg-[#FFE2DD]', text: 'text-[#D44026]' },
  { value: 'pos_installed', label: 'Proof Attached', bg: 'bg-[#D3E5EF]', text: 'text-[#0B6E99]' },
  { value: 'onboarded', label: 'Live in Hyperzod', bg: 'bg-[#D4EEE2]', text: 'text-[#0F7B54]' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  profiles,
  totalLeadsCount,
  filteredCount,
  cuisines
}) => {
  const isAnyFilterActive = 
    filters.stage !== 'all' || 
    filters.cuisine !== 'all' || 
    filters.assigneeId !== 'all' || 
    filters.minRating > 0 || 
    filters.hasPhone || 
    filters.hasProof || 
    filters.district !== 'all';

  const resetFilters = () => {
    onFilterChange({
      stage: 'all',
      cuisine: 'all',
      assigneeId: 'all',
      minRating: 0,
      hasPhone: false,
      hasProof: false,
      district: 'all',
      search: filters.search
    });
  };

  return (
    <div className="bg-[#FFFFFF] border-b border-[#EDEDEB] px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none">
      
      {/* Left Filter Controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        
        {/* Stage Filter */}
        <div className="flex items-center bg-[#F7F6F3] rounded border border-[#EDEDEB] px-2 py-1">
          <span className="text-[#787774] mr-1.5 text-[11px] font-medium">Stage:</span>
          <select
            value={filters.stage}
            onChange={(e) => onFilterChange({ ...filters, stage: e.target.value })}
            className="bg-transparent text-[#37352F] font-semibold text-xs cursor-pointer focus:outline-none"
          >
            {STAGES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Cuisine Filter */}
        <div className="flex items-center bg-[#F7F6F3] rounded border border-[#EDEDEB] px-2 py-1">
          <span className="text-[#787774] mr-1.5 text-[11px] font-medium">Cuisine:</span>
          <select
            value={filters.cuisine}
            onChange={(e) => onFilterChange({ ...filters, cuisine: e.target.value })}
            className="bg-transparent text-[#37352F] font-semibold text-xs cursor-pointer focus:outline-none max-w-[120px] truncate"
          >
            <option value="all">All Cuisines</option>
            {cuisines.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center bg-[#F7F6F3] rounded border border-[#EDEDEB] px-2 py-1">
          <span className="text-[#787774] mr-1.5 text-[11px] font-medium">Assignee:</span>
          <select
            value={filters.assigneeId}
            onChange={(e) => onFilterChange({ ...filters, assigneeId: e.target.value })}
            className="bg-transparent text-[#37352F] font-semibold text-xs cursor-pointer focus:outline-none"
          >
            <option value="all">Everyone</option>
            <option value="unassigned">Unassigned</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name.split(' ')[0]} ({p.role === 'pos_installer' ? 'POS' : p.role})</option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div className="flex items-center bg-[#F7F6F3] rounded border border-[#EDEDEB] px-2 py-1">
          <span className="text-[#787774] mr-1.5 text-[11px] font-medium">Rating:</span>
          <select
            value={filters.minRating}
            onChange={(e) => onFilterChange({ ...filters, minRating: parseFloat(e.target.value) || 0 })}
            className="bg-transparent text-[#37352F] font-semibold text-xs cursor-pointer focus:outline-none"
          >
            <option value={0}>Any Rating</option>
            <option value={4.0}>⭐ 4.0+ Stars</option>
            <option value={4.5}>⭐ 4.5+ Stars</option>
            <option value={4.8}>⭐ 4.8+ Stars</option>
          </select>
        </div>

        {/* Has Phone Toggle */}
        <button
          onClick={() => onFilterChange({ ...filters, hasPhone: !filters.hasPhone })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
            filters.hasPhone
              ? 'bg-[#D3E5EF] text-[#1879B5] border-[#B5D5E8] font-semibold'
              : 'bg-[#F7F6F3] text-[#787774] border-[#EDEDEB] hover:text-[#37352F]'
          }`}
        >
          <Phone className="w-3 h-3" />
          <span>Has Phone</span>
        </button>

        {/* Has Proof Toggle */}
        <button
          onClick={() => onFilterChange({ ...filters, hasProof: !filters.hasProof })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
            filters.hasProof
              ? 'bg-[#DBEDDB] text-[#286E34] border-[#BFE0BF] font-semibold'
              : 'bg-[#F7F6F3] text-[#787774] border-[#EDEDEB] hover:text-[#37352F]'
          }`}
        >
          <Camera className="w-3 h-3" />
          <span>Has POS Proof</span>
        </button>

        {/* Reset Button */}
        {isAnyFilterActive && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] text-[#787774] hover:text-[#D44026] hover:bg-[#FFE2DD] px-2 py-1 rounded transition-colors ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}

      </div>

      {/* Right Stats Counter */}
      <div className="text-[11px] text-[#787774] flex items-center gap-2">
        <span>Showing <strong className="text-[#37352F] font-semibold">{filteredCount}</strong> of {totalLeadsCount} restaurants</span>
        {isAnyFilterActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#1879B5]"></span>
        )}
      </div>

    </div>
  );
};

