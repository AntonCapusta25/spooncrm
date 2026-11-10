import React, { useState } from 'react';
import { CrmLead, CrmProfile, LeadStage } from '../types/crm';
import { updateLeadStage, updateLead, toggleLeadAssignee, provisionHyperzodMerchant, logVisit } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { 
  X, MapPin, Phone, Globe, Star, Mail, UserPlus, CheckCircle, 
  Camera, Zap, Clock, Navigation, ExternalLink, ChevronDown, Plus, Sparkles
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: CrmLead | null;
  onClose: () => void;
  onRefresh: () => void;
  onOpenProofModal: (lead: CrmLead) => void;
  profiles: CrmProfile[];
  currentProfile: CrmProfile | null;
}

const STAGES: { value: LeadStage; label: string; bg: string; text: string }[] = [
  { value: 'discovered', label: 'Discovered', bg: 'bg-[#E3E2E0]', text: 'text-[#5A5852]' },
  { value: 'contacted', label: 'Contacted', bg: 'bg-[#D3E5EF]', text: 'text-[#1879B5]' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', bg: 'bg-[#E8DEEE]', text: 'text-[#8232B4]' },
  { value: 'contract_signed', label: 'Contract Signed', bg: 'bg-[#DBEDDB]', text: 'text-[#286E34]' },
  { value: 'pos_handover', label: '⚡ Handed to Oleksandr', bg: 'bg-[#FFE2DD]', text: 'text-[#D44026]' },
  { value: 'pos_installed', label: 'Proof Attached', bg: 'bg-[#D3E5EF]', text: 'text-[#0B6E99]' },
  { value: 'onboarded', label: 'Live in Hyperzod', bg: 'bg-[#D4EEE2]', text: 'text-[#0F7B54]' },
  { value: 'lost', label: 'Lost', bg: 'bg-[#FFE2DD]', text: 'text-[#E03E3E]' },
];

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onRefresh,
  onOpenProofModal,
  profiles,
  currentProfile
}) => {
  if (!lead) return null;

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ success: boolean; text: string } | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(lead.commission_rate || 12);
  const [contactPerson, setContactPerson] = useState<string>(lead.contact_person || '');
  const [notes, setNotes] = useState<string>(lead.notes || '');

  // Log visit state
  const [newVisitNotes, setNewVisitNotes] = useState('');
  const [newVisitOutcome, setNewVisitOutcome] = useState('In-person visit');

  const currentStageObj = STAGES.find(s => s.value === lead.stage) || STAGES[0];

  const handleStageChange = async (newStage: LeadStage) => {
    await updateLeadStage(lead.id, newStage);
    onRefresh();
  };

  const handleToggleAssignee = async (profileId: string) => {
    const isAssigned = lead.assignees?.some(a => a.id === profileId) || false;
    await toggleLeadAssignee(lead.id, profileId, isAssigned);
    onRefresh();
  };

  const handleSaveDetails = async () => {
    await updateLead(lead.id, {
      contact_person: contactPerson,
      commission_rate: commissionRate,
      notes: notes
    });
    onRefresh();
    alert("Page properties saved!");
  };

  const handleProvisionHyperzod = async () => {
    setIsProvisioning(true);
    setProvisionResult(null);

    const res = await provisionHyperzodMerchant(lead.id, commissionRate);
    setIsProvisioning(false);

    if (res.success) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setProvisionResult({
        success: true,
        text: `Merchant created in Hyperzod! ID: ${res.hyperzod_merchant_id}`
      });
      onRefresh();
    } else {
      setProvisionResult({
        success: false,
        text: res.error || 'Provisioning failed'
      });
    }
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logVisit({
      lead_id: lead.id,
      profile_id: currentProfile?.id,
      visitor_name: currentProfile?.name || 'Sales Rep',
      visit_type: 'in_person',
      notes: newVisitNotes,
      outcome: newVisitOutcome
    });
    setNewVisitNotes('');
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl h-full bg-white border-l border-[#EDEDEB] shadow-2xl flex flex-col overflow-hidden text-[#37352F]">
        
        {/* Top Minimal Action Bar */}
        <div className="p-3 border-b border-[#EDEDEB] flex items-center justify-between text-xs text-[#787774]">
          <div className="flex items-center gap-2">
            <span>Spoonful</span>
            <span>/</span>
            <span className="text-[#37352F] font-medium truncate max-w-[200px]">{lead.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#F7F6F3] text-[#787774] hover:text-[#37352F]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Page Document Body */}
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 custom-scrollbar">

          {/* Notion Page Icon & Title */}
          <div>
            <div className="text-4xl mb-3">🍽️</div>
            <h1 className="text-2xl font-bold text-[#37352F] tracking-tight leading-tight">
              {lead.name}
            </h1>
          </div>

          {/* NOTION PROPERTIES TABLE */}
          <div className="space-y-2 border-y border-[#EDEDEB] py-4 text-[13px]">
            
            {/* Property: Stage */}
            <div className="flex items-center py-1">
              <div className="w-32 flex items-center gap-2 text-[#787774]">
                <span>🏷️</span>
                <span>Stage</span>
              </div>
              <div className="flex-1">
                <select
                  value={lead.stage}
                  onChange={(e) => handleStageChange(e.target.value as LeadStage)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer border-none focus:outline-none ${currentStageObj.bg} ${currentStageObj.text}`}
                >
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Property: Assignees */}
            <div className="flex items-center py-1">
              <div className="w-32 flex items-center gap-2 text-[#787774]">
                <span>👤</span>
                <span>Assignees</span>
              </div>
              <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                {profiles.map(p => {
                  const isAssigned = lead.assignees?.some(a => a.id === p.id) || false;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleToggleAssignee(p.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                        isAssigned
                          ? 'bg-[#E3E2E0] text-[#37352F] font-semibold'
                          : 'bg-[#F7F6F3] text-[#787774] hover:bg-[#EFEFED]'
                      }`}
                    >
                      <span>{p.name.split(' ')[0]}</span>
                      {isAssigned ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Property: Address */}
            <div className="flex items-center py-1">
              <div className="w-32 flex items-center gap-2 text-[#787774]">
                <span>📍</span>
                <span>Address</span>
              </div>
              <div className="flex-1 text-xs text-[#37352F] truncate">
                {lead.address}
              </div>
            </div>

            {/* Property: Phone */}
            <div className="flex items-center py-1">
              <div className="w-32 flex items-center gap-2 text-[#787774]">
                <span>📞</span>
                <span>Phone</span>
              </div>
              <div className="flex-1 text-xs">
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-[#1879B5] hover:underline">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-[#9B9A97]">Empty</span>
                )}
              </div>
            </div>

            {/* Property: Cuisine & Rating */}
            <div className="flex items-center py-1">
              <div className="w-32 flex items-center gap-2 text-[#787774]">
                <span>🍴</span>
                <span>Cuisine</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="bg-[#F7F6F3] text-xs text-[#37352F] px-2 py-0.5 rounded">
                  {lead.cuisine || 'Various'}
                </span>
                {lead.rating && (
                  <span className="flex items-center gap-1 text-xs text-[#787774]">
                    ⭐ {lead.rating} ({lead.reviews_count || 0} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Property: Commission */}
            <div className="flex items-center py-1">
              <div className="w-32 flex items-center gap-2 text-[#787774]">
                <span>💰</span>
                <span>Commission</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 12)}
                  className="w-16 bg-[#F7F6F3] text-xs text-[#37352F] px-2 py-0.5 rounded border border-[#EDEDEB] focus:outline-none"
                />
                <span className="text-xs text-[#787774]">% takeaway</span>
              </div>
            </div>

            {/* Property: POS Proof Photo */}
            <div className="flex items-center py-1">
              <div className="w-32 flex items-center gap-2 text-[#787774]">
                <span>📷</span>
                <span>POS Proof</span>
              </div>
              <div className="flex-1">
                {lead.proofs && lead.proofs.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={lead.proofs[0].photo_url}
                      alt="POS Proof"
                      className="w-12 h-12 rounded object-cover border border-[#EDEDEB] cursor-pointer"
                      onClick={() => window.open(lead.proofs![0].photo_url, '_blank')}
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-[#0F7B54]">✓ Counter Proof Attached</div>
                      <div className="text-[11px] text-[#787774]">{lead.proofs[0].terminal_model}</div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onOpenProofModal(lead)}
                    className="text-xs text-[#D44026] hover:bg-[#FFE2DD] px-2 py-0.5 rounded transition-colors font-semibold"
                  >
                    + Attach Proof Photo
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* NOTION CALLOUT BLOCK: POS INTEGRATION & HYPERZOD */}
          <div className="p-4 bg-[#FFF8F7] border border-[#FFE2DD] rounded-lg space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">💡</span>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[#D44026]">
                  POS Integration & Hyperzod Provisioning
                </div>
                <p className="text-xs text-[#787774] mt-0.5">
                  Deliver the Sunmi terminal, verify photo proof, and provision the merchant into Hyperzod.
                </p>
              </div>
            </div>

            {lead.stage === 'onboarded' && lead.hyperzod_merchant_id ? (
              <div className="bg-[#D4EEE2] border border-[#B3E1CD] p-2.5 rounded text-xs text-[#0F7B54] font-mono flex items-center justify-between">
                <span>Active Merchant ID: {lead.hyperzod_merchant_id}</span>
                <CheckCircle className="w-4 h-4 text-[#0F7B54]" />
              </div>
            ) : (
              <div className="pt-1">
                <button
                  onClick={handleProvisionHyperzod}
                  disabled={isProvisioning}
                  className="w-full bg-[#FF5A1F] hover:bg-[#E04B14] text-white font-semibold text-xs py-2 px-3 rounded shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  {isProvisioning ? 'Creating in Hyperzod...' : '⚡ 1-Click Provision in Hyperzod'}
                </button>

                {provisionResult && (
                  <div className={`mt-2 p-2 rounded text-xs font-medium ${
                    provisionResult.success ? 'bg-[#D4EEE2] text-[#0F7B54]' : 'bg-[#FFE2DD] text-[#D44026]'
                  }`}>
                    {provisionResult.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NOTION DOCUMENT BODY: Notes & Field Visits */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-[#787774] block mb-1">
                Notes & Preferences:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write notes on restaurant owner, preferred delivery types, or counter space..."
                className="w-full bg-[#F7F6F3] text-xs text-[#37352F] p-3 rounded border border-[#EDEDEB] focus:outline-none focus:border-[#D4D4D0]"
              />
              <button
                onClick={handleSaveDetails}
                className="mt-1 text-xs text-[#1879B5] hover:underline font-semibold"
              >
                Save Notes
              </button>
            </div>

            {/* Field Visits Activity */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-[#787774] mb-2 uppercase tracking-wider">
                Field Visits & Check-Ins ({lead.visits?.length || 0})
              </h3>

              <form onSubmit={handleAddVisit} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Log visit note (e.g. met owner, delivered menu)..."
                  value={newVisitNotes}
                  onChange={(e) => setNewVisitNotes(e.target.value)}
                  required
                  className="flex-1 bg-[#F7F6F3] text-xs text-[#37352F] px-3 py-1.5 rounded border border-[#EDEDEB] focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#EFEFED] hover:bg-[#E3E2E0] text-[#37352F] font-semibold text-xs px-3 py-1.5 rounded transition-colors"
                >
                  Log
                </button>
              </form>

              <div className="space-y-2">
                {lead.visits && lead.visits.length > 0 ? (
                  lead.visits.map((v) => (
                    <div key={v.id} className="p-2.5 bg-[#F7F6F3] rounded text-xs space-y-0.5">
                      <div className="flex items-center justify-between text-[#787774] text-[11px]">
                        <span>By {v.visitor_name}</span>
                        <span>{new Date(v.visited_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#37352F]">{v.notes || v.outcome}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#9B9A97] italic">No visit history yet.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
