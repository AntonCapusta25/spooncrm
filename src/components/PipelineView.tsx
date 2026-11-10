import React from 'react';
import { CrmLead, LeadStage, CrmProfile } from '../types/crm';
import { updateLeadStage } from '../lib/supabase';
import { Flame, Star, Phone, MapPin, CheckCircle, ArrowRight, Camera, Plus, Zap } from 'lucide-react';

interface PipelineViewProps {
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onOpenProofModal: (lead: CrmLead) => void;
  onRefresh: () => void;
  currentProfile: CrmProfile | null;
}

const NOTION_COLUMNS: { stage: LeadStage; title: string; bg: string; text: string }[] = [
  { stage: 'discovered', title: 'Discovered', bg: 'bg-[#E3E2E0]', text: 'text-[#5A5852]' },
  { stage: 'contacted', title: 'Contacted', bg: 'bg-[#D3E5EF]', text: 'text-[#1879B5]' },
  { stage: 'meeting_scheduled', title: 'Meeting Scheduled', bg: 'bg-[#E8DEEE]', text: 'text-[#8232B4]' },
  { stage: 'contract_signed', title: 'Contract Signed', bg: 'bg-[#DBEDDB]', text: 'text-[#286E34]' },
  { stage: 'pos_handover', title: '⚡ Handed to Oleksandr', bg: 'bg-[#FFE2DD]', text: 'text-[#D44026]' },
  { stage: 'pos_installed', title: 'Proof Attached', bg: 'bg-[#D3E5EF]', text: 'text-[#0B6E99]' },
  { stage: 'onboarded', title: 'Live in Hyperzod', bg: 'bg-[#D4EEE2]', text: 'text-[#0F7B54]' },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  leads,
  onSelectLead,
  onOpenProofModal,
  onRefresh
}) => {
  const handleQuickAdvance = async (e: React.MouseEvent, lead: CrmLead, nextStage: LeadStage) => {
    e.stopPropagation();
    await updateLeadStage(lead.id, nextStage);
    onRefresh();
  };

  return (
    <div className="h-[calc(100vh-105px)] overflow-x-auto p-6 bg-white select-none">
      <div className="flex gap-4 min-w-[1700px] h-full pb-4 items-start">
        {NOTION_COLUMNS.map((col) => {
          const columnLeads = leads.filter(l => l.stage === col.stage);
          const isOleksandrStage = col.stage === 'pos_handover';

          return (
            <div
              key={col.stage}
              className="w-72 shrink-0 flex flex-col max-h-full"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${col.bg} ${col.text}`}>
                    {col.title}
                  </span>
                  <span className="text-xs text-[#787774] font-mono">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {columnLeads.map((lead) => {
                  const isHandover = lead.stage === 'pos_handover';

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className={`group p-3 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        isHandover
                          ? 'border-[#F5C0B8] shadow-xs'
                          : 'border-[#EDEDEB] hover:border-[#D4D4D0]'
                      }`}
                    >
                      {/* Name with Notion Page Icon */}
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="text-xs font-semibold text-[#37352F] group-hover:text-[#1879B5] transition-colors leading-snug line-clamp-1">
                          {lead.name}
                        </h4>
                        {lead.rating && (
                          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#37352F] shrink-0">
                            <Star className="w-3 h-3 fill-[#F39C12] text-[#F39C12]" />
                            {lead.rating}
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <p className="text-[11px] text-[#787774] truncate mb-2">
                        {lead.address}
                      </p>

                      {/* Footer Row: Tags & Assignees */}
                      <div className="pt-2 border-t border-[#EDEDEB] flex items-center justify-between">
                        <span className="text-[10px] text-[#787774] bg-[#F7F6F3] px-1.5 py-0.5 rounded truncate max-w-[110px]">
                          {lead.cuisine || 'Restaurant'}
                        </span>

                        <div className="flex items-center -space-x-1">
                          {lead.assignees && lead.assignees.length > 0 ? (
                            lead.assignees.map((assignee) => (
                              <div
                                key={assignee.id}
                                title={`${assignee.name} (${assignee.role})`}
                                className="w-5 h-5 rounded-full bg-[#E3E2E0] border border-white flex items-center justify-center text-[9px] font-bold text-[#37352F]"
                              >
                                {assignee.name.charAt(0)}
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#9B9A97] italic">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Handover to Oleksandr Action */}
                      {isHandover && (
                        <div className="mt-2 pt-2 border-t border-[#FFE2DD]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenProofModal(lead);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#FFE2DD] hover:bg-[#FAD0C8] text-[#D44026] text-xs font-bold py-1 px-2 rounded transition-colors"
                          >
                            <Camera className="w-3 h-3" />
                            Attach Photo Proof
                          </button>
                        </div>
                      )}

                      {/* Quick Advance for Signed */}
                      {lead.stage === 'contract_signed' && (
                        <div className="mt-2 pt-2 border-t border-[#EDEDEB]">
                          <button
                            onClick={(e) => handleQuickAdvance(e, lead, 'pos_handover')}
                            className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-[#286E34] hover:bg-[#DBEDDB] py-1 rounded transition-colors"
                          >
                            Hand over to Oleksandr
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Live Hyperzod ID badge */}
                      {lead.stage === 'onboarded' && lead.hyperzod_merchant_id && (
                        <div className="mt-2 text-[10px] font-mono text-[#0F7B54] bg-[#D4EEE2] px-2 py-0.5 rounded flex items-center justify-between">
                          <span>ID: {lead.hyperzod_merchant_id.substring(0, 8)}...</span>
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Notion-style "+ New" button at bottom of column */}
                <button
                  onClick={() => alert("Click + New at top to add prospect")}
                  className="w-full flex items-center gap-1.5 p-2 text-xs text-[#787774] hover:bg-[#F7F6F3] rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
