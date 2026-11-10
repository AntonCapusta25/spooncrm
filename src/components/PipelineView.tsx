import React from 'react';
import { CrmLead, LeadStage, CrmProfile } from '../types/crm';
import { updateLeadStage } from '../lib/supabase';
import { Flame, Star, Phone, MapPin, CheckCircle, ArrowRight, Camera, Zap, UserPlus } from 'lucide-react';

interface PipelineViewProps {
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onOpenProofModal: (lead: CrmLead) => void;
  onRefresh: () => void;
  currentProfile: CrmProfile | null;
}

const PIPELINE_COLUMNS: { stage: LeadStage; title: string; subtitle: string; color: string; badge: string }[] = [
  {
    stage: 'discovered',
    title: 'Discovered',
    subtitle: 'Enschede prospects',
    color: 'border-slate-700 bg-slate-900/50',
    badge: 'bg-slate-700 text-slate-300'
  },
  {
    stage: 'contacted',
    title: 'Contacted',
    subtitle: 'First pitch made',
    color: 'border-sky-500/30 bg-sky-950/20',
    badge: 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
  },
  {
    stage: 'meeting_scheduled',
    title: 'Meeting / Tasting',
    subtitle: 'Demo or tasting set',
    color: 'border-purple-500/30 bg-purple-950/20',
    badge: 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
  },
  {
    stage: 'contract_signed',
    title: 'Contract Signed',
    subtitle: 'Commercial deal closed',
    color: 'border-emerald-500/30 bg-emerald-950/20',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  },
  {
    stage: 'pos_handover',
    title: '⚡ Handed to Oleksandr',
    subtitle: 'Waiting for POS installation',
    color: 'border-orange-500/60 bg-orange-950/30 ring-1 ring-orange-500/40',
    badge: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 font-bold'
  },
  {
    stage: 'pos_installed',
    title: 'Proof Attached',
    subtitle: 'Photo uploaded & verified',
    color: 'border-cyan-500/30 bg-cyan-950/20',
    badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
  },
  {
    stage: 'onboarded',
    title: 'Live in Hyperzod',
    subtitle: 'Taking orders on Spoonful',
    color: 'border-green-500/40 bg-green-950/20',
    badge: 'bg-green-500/20 text-green-300 border border-green-500/40'
  }
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  leads,
  onSelectLead,
  onOpenProofModal,
  onRefresh,
  currentProfile
}) => {
  const handleQuickAdvance = async (e: React.MouseEvent, lead: CrmLead, nextStage: LeadStage) => {
    e.stopPropagation();
    await updateLeadStage(lead.id, nextStage);
    onRefresh();
  };

  return (
    <div className="h-[calc(100vh-65px)] overflow-x-auto p-4 bg-slate-950">
      <div className="flex gap-4 min-w-[1750px] h-full pb-4">
        {PIPELINE_COLUMNS.map((col) => {
          const columnLeads = leads.filter(l => l.stage === col.stage);
          const isOleksandrStage = col.stage === 'pos_handover';

          return (
            <div
              key={col.stage}
              className={`w-72 shrink-0 flex flex-col rounded-2xl border backdrop-blur-md p-3 ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex items-start justify-between mb-3 px-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white tracking-wide">
                      {col.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
                      {columnLeads.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {col.subtitle}
                  </p>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {columnLeads.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-xs font-medium">
                    No restaurants here
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const isHandover = lead.stage === 'pos_handover';
                    const hasProof = lead.proofs && lead.proofs.length > 0;

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        className={`group relative p-3 rounded-xl border bg-slate-900/90 hover:bg-slate-850 hover:border-slate-600 cursor-pointer transition-all shadow-sm hover:shadow-xl ${
                          isHandover
                            ? 'border-orange-500/50 hover:border-orange-400 ring-1 ring-orange-500/20'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Tags & Rating */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            {lead.cuisine || 'Food & Dining'}
                          </span>
                          {lead.rating && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {lead.rating}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-extrabold text-white group-hover:text-orange-400 transition-colors leading-snug line-clamp-1">
                          {lead.name}
                        </h4>

                        {/* Address */}
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          {lead.address}
                        </p>

                        {/* Multi-assignees */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {lead.assignees && lead.assignees.length > 0 ? (
                              lead.assignees.map((assignee) => (
                                <div
                                  key={assignee.id}
                                  title={`${assignee.name} (${assignee.role})`}
                                  className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-orange-300"
                                >
                                  {assignee.name.charAt(0)}
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                            )}
                          </div>

                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-sky-400 p-1"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Dedicated Action on Handover to Oleksandr */}
                        {isHandover && (
                          <div className="mt-2.5 pt-2 border-t border-orange-500/20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenProofModal(lead);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] font-extrabold py-1.5 px-2 rounded-lg shadow-md shadow-orange-500/25 transition-all"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Attach Photo Proof
                            </button>
                          </div>
                        )}

                        {/* Quick Advance for Contract Signed */}
                        {lead.stage === 'contract_signed' && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800">
                            <button
                              onClick={(e) => handleQuickAdvance(e, lead, 'pos_handover')}
                              className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-orange-500 text-orange-400 hover:text-white text-[11px] font-bold py-1 px-2 rounded-lg transition-colors border border-slate-700 hover:border-orange-500"
                            >
                              Hand to Oleksandr
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Live Hyperzod badge */}
                        {lead.stage === 'onboarded' && lead.hyperzod_merchant_id && (
                          <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center justify-between">
                            <span>ID: {lead.hyperzod_merchant_id.substring(0, 10)}...</span>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
