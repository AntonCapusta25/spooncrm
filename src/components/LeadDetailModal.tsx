import React, { useState } from 'react';
import { CrmLead, CrmProfile, LeadStage } from '../types/crm';
import { updateLeadStage, updateLead, toggleLeadAssignee, provisionHyperzodMerchant, logVisit } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { 
  X, MapPin, Phone, Globe, Star, Mail, UserPlus, CheckCircle, 
  Camera, Zap, Clock, Navigation, AlertCircle, ExternalLink 
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: CrmLead | null;
  onClose: () => void;
  onRefresh: () => void;
  onOpenProofModal: (lead: CrmLead) => void;
  profiles: CrmProfile[];
  currentProfile: CrmProfile | null;
}

const STAGES: { value: LeadStage; label: string }[] = [
  { value: 'discovered', label: 'Discovered' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'meeting_scheduled', label: 'Meeting / Tasting' },
  { value: 'contract_signed', label: 'Contract Signed' },
  { value: 'pos_handover', label: 'Handed to Oleksandr (POS)' },
  { value: 'pos_installed', label: 'POS Proof Attached' },
  { value: 'onboarded', label: 'Onboarded & Live' },
  { value: 'lost', label: 'Lost / Closed' },
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
  const [newVisitOutcome, setNewVisitOutcome] = useState('In-person follow-up');

  // Handle stage change
  const handleStageChange = async (newStage: LeadStage) => {
    await updateLeadStage(lead.id, newStage);
    onRefresh();
  };

  // Handle Multi-Assignee Toggle
  const handleToggleAssignee = async (profileId: string) => {
    const isAssigned = lead.assignees?.some(a => a.id === profileId) || false;
    await toggleLeadAssignee(lead.id, profileId, isAssigned);
    onRefresh();
  };

  // Save edits
  const handleSaveDetails = async () => {
    await updateLead(lead.id, {
      contact_person: contactPerson,
      commission_rate: commissionRate,
      notes: notes
    });
    onRefresh();
    alert("Lead details updated!");
  };

  // 1-Click Provision in Hyperzod
  const handleProvisionHyperzod = async () => {
    setIsProvisioning(true);
    setProvisionResult(null);

    const res = await provisionHyperzodMerchant(lead.id, commissionRate);
    setIsProvisioning(false);

    if (res.success) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      setProvisionResult({
        success: true,
        text: `Merchant created in Hyperzod! ID: ${res.hyperzod_merchant_id}`
      });
      onRefresh();
    } else {
      setProvisionResult({
        success: false,
        text: res.error || 'Failed to create merchant'
      });
    }
  };

  // Add quick visit
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-850 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {lead.cuisine || 'Restaurant'}
              </span>
              {lead.rating && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {lead.rating} ({lead.reviews_count || 0} reviews)
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white leading-tight">{lead.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {lead.address}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

          {/* Stage Selector Bar */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Current Pipeline Stage:
            </label>
            <select
              value={lead.stage}
              onChange={(e) => handleStageChange(e.target.value as LeadStage)}
              className="w-full bg-slate-800 text-xs font-bold text-orange-400 border border-slate-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            >
              {STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* OLEKSANDR'S POS INTEGRATION & PROVISIONING CARD */}
          <div className="bg-gradient-to-br from-orange-950/40 to-slate-900 border border-orange-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
                <h3 className="text-xs font-black text-white tracking-wide uppercase">
                  POS Integration & Hyperzod Provisioning
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {lead.stage === 'onboarded' ? 'Live Store' : 'Handover Pipeline'}
              </span>
            </div>

            {/* Photo Proof Status */}
            {lead.proofs && lead.proofs.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <img
                    src={lead.proofs[0].photo_url}
                    alt="POS Proof"
                    className="w-16 h-16 rounded-lg object-cover border border-cyan-500 cursor-pointer"
                    onClick={() => window.open(lead.proofs![0].photo_url, '_blank')}
                  />
                  <div className="text-xs">
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Counter Photo Proof Verified
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Model: {lead.proofs[0].terminal_model}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Installed by: {lead.proofs[0].uploader_name}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-xl border border-dashed border-orange-500/30">
                <div className="text-xs text-slate-300">
                  <span className="text-orange-400 font-bold block">No POS Proof Attached Yet</span>
                  Oleksandr should upload a photo of the counter terminal.
                </div>
                <button
                  onClick={() => onOpenProofModal(lead)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Attach Proof
                </button>
              </div>
            )}

            {/* Hyperzod Provision Button */}
            {lead.stage === 'onboarded' && lead.hyperzod_merchant_id ? (
              <div className="bg-emerald-950/80 border border-emerald-500/40 p-3 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">Active Hyperzod Merchant</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="font-mono text-[11px] text-emerald-200">
                  Merchant ID: {lead.hyperzod_merchant_id}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleProvisionHyperzod}
                  disabled={isProvisioning}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  {isProvisioning ? 'Creating Merchant in Hyperzod...' : '⚡ Create Merchant in Hyperzod'}
                </button>

                {provisionResult && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                    provisionResult.success
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}>
                    {provisionResult.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MULTI-ASSIGNEES SELECTOR */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Assigned Team Members (Multi-Assignee):
            </label>
            <div className="flex flex-wrap gap-2">
              {profiles.map(p => {
                const isAssigned = lead.assignees?.some(a => a.id === p.id) || false;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleToggleAssignee(p.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isAssigned
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold">
                      {p.name.charAt(0)}
                    </div>
                    {p.name.split(' ')[0]} ({p.role === 'pos_installer' ? 'POS' : p.role})
                    {isAssigned && <CheckCircle className="w-3 h-3 text-orange-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTACT & COMMERCIAL FIELDS */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Contact & Commission Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Contact Person / Owner:</label>
                <input
                  type="text"
                  placeholder="e.g. Marco Rossi"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Commission Rate (%):</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 12)}
                  className="w-full bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold p-2.5 rounded-xl border border-slate-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {lead.phone}
                </a>
              )}

              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold p-2.5 rounded-xl border border-slate-700 transition-colors truncate"
                >
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Visit Website</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-slate-500" />
                </a>
              )}
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Internal Notes:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes on menu, POS counter spot, or owner preferences..."
                className="w-full bg-slate-800 text-xs text-white border border-slate-700 rounded-lg p-2.5 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveDetails}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl border border-slate-700 transition-colors"
            >
              Save Details
            </button>
          </div>

          {/* VISITS & AUDIT LOG */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Visit History ({lead.visits?.length || 0})
            </h3>

            <form onSubmit={handleAddVisit} className="flex gap-2">
              <input
                type="text"
                placeholder="Log note (e.g. visited owner, dropped off contract)..."
                value={newVisitNotes}
                onChange={(e) => setNewVisitNotes(e.target.value)}
                required
                className="flex-1 bg-slate-800 text-xs text-white border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-2 rounded-xl shrink-0"
              >
                Log Visit
              </button>
            </form>

            <div className="space-y-2">
              {lead.visits && lead.visits.length > 0 ? (
                lead.visits.map((v) => (
                  <div key={v.id} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>By {v.visitor_name}</span>
                      <span>{new Date(v.visited_at).toLocaleDateString()} {new Date(v.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200 mt-1">{v.notes || v.outcome}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No previous visits logged.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

