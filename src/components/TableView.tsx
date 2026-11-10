import React, { useState } from 'react';
import { CrmLead, LeadStage } from '../types/crm';
import { updateLeadStage } from '../lib/supabase';
import { 
  Star, MapPin, Phone, ArrowUpDown, ChevronRight, 
  ExternalLink, Plus, Flame, CheckCircle2, MoreHorizontal
} from 'lucide-react';

interface TableViewProps {
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onOpenProofModal: (lead: CrmLead) => void;
  onRefresh: () => void;
}

const STAGE_TAGS: Record<LeadStage, { label: string; bg: string; text: string }> = {
  discovered: { label: 'Discovered', bg: 'bg-[#E3E2E0]', text: 'text-[#5A5852]' },
  contacted: { label: 'Contacted', bg: 'bg-[#D3E5EF]', text: 'text-[#1879B5]' },
  meeting_scheduled: { label: 'Meeting', bg: 'bg-[#E8DEEE]', text: 'text-[#8232B4]' },
  contract_signed: { label: 'Signed', bg: 'bg-[#DBEDDB]', text: 'text-[#286E34]' },
  pos_handover: { label: 'POS Handover', bg: 'bg-[#FFE2DD]', text: 'text-[#D44026]' },
  pos_installed: { label: 'Proof Attached', bg: 'bg-[#D3E5EF]', text: 'text-[#0B6E99]' },
  onboarded: { label: 'Live in Hyperzod', bg: 'bg-[#D4EEE2]', text: 'text-[#0F7B54]' },
  lost: { label: 'Lost', bg: 'bg-[#FFE2DD]', text: 'text-[#E03E3E]' },
};

export const TableView: React.FC<TableViewProps> = ({
  leads,
  onSelectLead,
  onOpenProofModal,
  onRefresh
}) => {
  const [sortField, setSortField] = useState<'name' | 'rating' | 'stage'>('rating');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedLeads = [...leads].sort((a, b) => {
    if (sortField === 'rating') {
      return sortAsc ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0);
    }
    if (sortField === 'name') {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    return 0;
  });

  return (
    <div className="h-[calc(100vh-105px)] overflow-auto bg-white text-[#37352F] text-[13px]">
      <table className="w-full border-collapse text-left">
        {/* Table Header */}
        <thead className="bg-[#F7F6F3] sticky top-0 z-10 border-b border-[#EDEDEB] text-[#787774] text-xs font-normal">
          <tr>
            <th className="py-2 px-4 border-r border-[#EDEDEB] w-72 font-medium">
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}>
                <span>🍽️ Name</span>
                <ArrowUpDown className="w-3 h-3 text-[#9B9A97]" />
              </div>
            </th>
            <th className="py-2 px-3 border-r border-[#EDEDEB] w-40 font-medium">
              <span>🏷️ Stage</span>
            </th>
            <th className="py-2 px-3 border-r border-[#EDEDEB] w-36 font-medium">
              <span>🍴 Cuisine</span>
            </th>
            <th className="py-2 px-3 border-r border-[#EDEDEB] w-24 font-medium">
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => { setSortField('rating'); setSortAsc(!sortAsc); }}>
                <span>⭐ Rating</span>
                <ArrowUpDown className="w-3 h-3 text-[#9B9A97]" />
              </div>
            </th>
            <th className="py-2 px-3 border-r border-[#EDEDEB] w-36 font-medium">
              <span>👤 Assignees</span>
            </th>
            <th className="py-2 px-3 border-r border-[#EDEDEB] min-w-[220px] font-medium">
              <span>📍 Address</span>
            </th>
            <th className="py-2 px-3 border-r border-[#EDEDEB] w-32 font-medium">
              <span>📞 Phone</span>
            </th>
            <th className="py-2 px-3 w-32 font-medium">
              <span>⚡ Action</span>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-[#EDEDEB]">
          {sortedLeads.map((lead) => {
            const stageTag = STAGE_TAGS[lead.stage] || STAGE_TAGS.discovered;
            const isHandover = lead.stage === 'pos_handover';

            return (
              <tr
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="hover:bg-[#F7F6F3] group cursor-pointer transition-colors"
              >
                {/* Name */}
                <td className="py-2 px-4 border-r border-[#EDEDEB] font-medium text-[#37352F]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{lead.name}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-[11px] text-[#787774] bg-[#EFEFED] px-1.5 py-0.5 rounded transition-opacity shrink-0">
                      OPEN
                    </span>
                  </div>
                </td>

                {/* Stage (Notion select pill) */}
                <td className="py-2 px-3 border-r border-[#EDEDEB]">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${stageTag.bg} ${stageTag.text}`}>
                    {stageTag.label}
                  </span>
                </td>

                {/* Cuisine */}
                <td className="py-2 px-3 border-r border-[#EDEDEB] text-[#787774]">
                  <span className="bg-[#F7F6F3] px-2 py-0.5 rounded text-xs text-[#5A5852] truncate block max-w-[120px]">
                    {lead.cuisine || 'Restaurant'}
                  </span>
                </td>

                {/* Rating */}
                <td className="py-2 px-3 border-r border-[#EDEDEB]">
                  {lead.rating && (
                    <span className="flex items-center gap-1 text-xs text-[#37352F] font-semibold">
                      <Star className="w-3 h-3 fill-[#F39C12] text-[#F39C12]" />
                      {lead.rating}
                    </span>
                  )}
                </td>

                {/* Assignees */}
                <td className="py-2 px-3 border-r border-[#EDEDEB]">
                  <div className="flex items-center gap-1">
                    {lead.assignees && lead.assignees.length > 0 ? (
                      lead.assignees.map((a) => (
                        <div
                          key={a.id}
                          title={`${a.name} (${a.role})`}
                          className="w-5 h-5 rounded-full bg-[#E3E2E0] text-[#37352F] flex items-center justify-center text-[10px] font-bold"
                        >
                          {a.name.charAt(0)}
                        </div>
                      ))
                    ) : (
                      <span className="text-[#9B9A97] text-xs italic">Unassigned</span>
                    )}
                  </div>
                </td>

                {/* Address */}
                <td className="py-2 px-3 border-r border-[#EDEDEB] text-[#787774] text-xs truncate max-w-[260px]">
                  {lead.address}
                </td>

                {/* Phone */}
                <td className="py-2 px-3 border-r border-[#EDEDEB] text-[#787774] text-xs">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-[#1879B5] underline"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-[#9B9A97]">—</span>
                  )}
                </td>

                {/* Action */}
                <td className="py-2 px-3">
                  {isHandover ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProofModal(lead);
                      }}
                      className="bg-[#FFE2DD] hover:bg-[#FAD0C8] text-[#D44026] text-[11px] font-bold px-2 py-0.5 rounded transition-colors whitespace-nowrap"
                    >
                      📷 Proof
                    </button>
                  ) : lead.stage === 'contract_signed' ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await updateLeadStage(lead.id, 'pos_handover');
                        onRefresh();
                      }}
                      className="text-[11px] text-[#286E34] hover:bg-[#DBEDDB] px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                    >
                      ⚡ Hand to POS
                    </button>
                  ) : (
                    <span className="text-[#9B9A97] text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Table Footer */}
      <div className="py-3 px-4 border-t border-[#EDEDEB] bg-[#F7F6F3] text-xs text-[#787774] flex items-center justify-between">
        <span>Count: {leads.length} rows</span>
        <span className="text-[#9B9A97]">Spoonful Field Database</span>
      </div>
    </div>
  );
};

