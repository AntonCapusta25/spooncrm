import React, { useState, useMemo } from 'react';
import { 
  CrmLead, CrmProfile, LeadStage, isLeadApplication, parseApplicationDetails 
} from '../types/crm';
import { updateLeadStage, toggleLeadAssignee } from '../lib/supabase';
import { 
  Sparkles, Phone, Mail, MessageCircle, MapPin, ExternalLink, 
  Clock, CheckCircle2, User, ChevronRight, Copy, Check, Filter, 
  Search, ArrowUpRight, Store, Calendar, AlertCircle
} from 'lucide-react';

interface ApplicationsViewProps {
  leads: CrmLead[];
  profiles: CrmProfile[];
  currentProfile: CrmProfile | null;
  onSelectLead: (lead: CrmLead) => void;
  onOpenProofModal: (lead: CrmLead) => void;
  onNavigateToMap: (lead: CrmLead) => void;
  onRefresh: () => void;
  onOpenOnboardingFlow: () => void;
}

const STAGE_CONFIG: Record<LeadStage, { label: string; bg: string; text: string }> = {
  discovered: { label: 'Discovered', bg: 'bg-[#E3E2E0]', text: 'text-[#5A5852]' },
  contacted: { label: 'Contacted', bg: 'bg-[#D3E5EF]', text: 'text-[#1879B5]' },
  meeting_scheduled: { label: 'Meeting Set', bg: 'bg-[#E8DEEE]', text: 'text-[#8232B4]' },
  contract_signed: { label: 'Signed', bg: 'bg-[#DBEDDB]', text: 'text-[#286E34]' },
  pos_handover: { label: 'POS Handover', bg: 'bg-[#FFE2DD]', text: 'text-[#D44026]' },
  pos_installed: { label: 'POS Installed', bg: 'bg-[#D3E5EF]', text: 'text-[#0B6E99]' },
  onboarded: { label: 'Live Hyperzod', bg: 'bg-[#D4EEE2]', text: 'text-[#0F7B54]' },
  lost: { label: 'Lost', bg: 'bg-[#FFE2DD]', text: 'text-[#E03E3E]' },
};

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  leads,
  profiles,
  currentProfile,
  onSelectLead,
  onOpenProofModal,
  onNavigateToMap,
  onRefresh,
  onOpenOnboardingFlow,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'needs_action' | 'meeting' | 'new_points'>('all');

  // Filter only applications
  const applicationLeads = useMemo(() => {
    return leads.filter(l => isLeadApplication(l));
  }, [leads]);

  // Metrics
  const stats = useMemo(() => {
    const total = applicationLeads.length;
    const newPoints = applicationLeads.filter(l => l.rating === 5.0 && l.reviews_count === 1).length;
    const matched = total - newPoints;
    const needsAction = applicationLeads.filter(l => l.stage === 'discovered' || l.stage === 'contacted').length;
    return { total, newPoints, matched, needsAction };
  }, [applicationLeads]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applicationLeads.filter(l => {
      if (filterMode === 'needs_action' && !(l.stage === 'discovered' || l.stage === 'contacted')) return false;
      if (filterMode === 'meeting' && l.stage !== 'meeting_scheduled') return false;
      if (filterMode === 'new_points' && !(l.rating === 5.0 && l.reviews_count === 1)) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesContact = l.contact_person?.toLowerCase().includes(q);
        const matchesPhone = l.phone?.includes(q);
        const matchesEmail = l.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesContact && !matchesPhone && !matchesEmail) return false;
      }
      return true;
    });
  }, [applicationLeads, filterMode, search]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStageChange = async (leadId: string, stage: LeadStage) => {
    await updateLeadStage(leadId, stage);
    onRefresh();
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      
      {/* Top Banner & Fast Metrics */}
      <div className="p-4 md:p-6 border-b border-[#EDEDEB] space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📩</span>
              <h2 className="text-lg md:text-xl font-bold text-[#37352F] tracking-tight">
                Inbound Partner Applications
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF1EB] text-[#FF5A1F] border border-[#FF5A1F]/20">
                {applicationLeads.length} Total
              </span>
            </div>
            <p className="text-xs text-[#787774] mt-0.5">
              Live submissions from the Typeform onboarding flow. Matched to scraped leads or inserted as new points on the map.
            </p>
          </div>

          {/* Quick Actions: Share Link + Preview Flow */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EDEDEB] hover:bg-[#F7F6F3] text-xs font-semibold text-[#37352F] transition-all cursor-pointer shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-[#22C55E]">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#787774]" />
                  <span>Copy Onboarding Link</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenOnboardingFlow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E04B14] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Test Flow</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#F7F6F3] border border-[#EDEDEB]">
            <span className="text-[11px] font-semibold text-[#787774] block">Total Applications</span>
            <span className="text-xl font-bold text-[#37352F]">{stats.total}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
            <span className="text-[11px] font-semibold text-[#166534] block">Matched Scraped Leads</span>
            <span className="text-xl font-bold text-[#15803D]">{stats.matched}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]">
            <span className="text-[11px] font-semibold text-[#9A3412] block">New Points on Map</span>
            <span className="text-xl font-bold text-[#C2410C]">{stats.newPoints}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#FFE2DD] border border-[#F5C0B8]">
            <span className="text-[11px] font-semibold text-[#D44026] block">Needs Call / Action</span>
            <span className="text-xl font-bold text-[#D44026]">{stats.needsAction}</span>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All (${applicationLeads.length})` },
              { id: 'needs_action', label: `Needs Call (${stats.needsAction})` },
              { id: 'meeting', label: 'Meeting Scheduled' },
              { id: 'new_points', label: `New Map Points (${stats.newPoints})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-[#37352F] text-white font-semibold'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9B9A97]" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F7F6F3] text-xs text-[#37352F] pl-8 pr-3 py-1.5 rounded-lg border border-[#EDEDEB] focus:outline-none focus:border-[#D4D4D0]"
            />
          </div>
        </div>

      </div>

      {/* Applications List */}
      <div className="flex-1 p-4 md:p-6 space-y-3">
        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#787774]">
            <Store className="w-10 h-10 text-[#D4D4D0] mb-3 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#37352F]">No applications found</p>
            <p className="text-xs text-[#787774] max-w-sm mt-1">
              Applications submitted through the Typeform onboarding flow will show up here in real-time.
            </p>
            <button
              onClick={onOpenOnboardingFlow}
              className="mt-4 px-4 py-2 rounded-lg bg-[#FF5A1F] hover:bg-[#E04B14] text-white text-xs font-semibold shadow-xs"
            >
              Submit a Test Application
            </button>
          </div>
        ) : (
          filteredApplications.map((lead) => {
            const details = parseApplicationDetails(lead);
            const isNewPoint = lead.rating === 5.0 && lead.reviews_count === 1;

            return (
              <div 
                key={lead.id}
                className="bg-white rounded-xl border border-[#EDEDEB] hover:border-[#D4D4D0] p-4 md:p-5 shadow-2xs hover:shadow-xs transition-all space-y-3"
              >
                {/* Header row: Restaurant + Badges + Stage Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F7F6F3]">
                  
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🍽️</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="font-bold text-sm md:text-base text-[#37352F] hover:text-[#FF5A1F] hover:underline text-left"
                        >
                          {lead.name}
                        </button>

                        {/* Match Status Badge */}
                        {isNewPoint ? (
                          <span className="bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            ★ New Point on Map
                          </span>
                        ) : (
                          <span className="bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Matched Scraped Lead
                          </span>
                        )}

                        {details?.hasOwnDelivery && (
                          <span className="bg-[#FFF1EB] text-[#FF5A1F] border border-[#FF5A1F]/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            🛵 {details.hasOwnDelivery}
                          </span>
                        )}

                        {lead.priority === 'urgent' && (
                          <span className="bg-[#FFE2DD] text-[#D44026] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ⚡ Urgent
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#787774] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#9B9A97]" />
                        <span>{lead.address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Stage Dropdown Pill */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#787774]">Stage:</span>
                    <select
                      value={lead.stage}
                      onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                      className="bg-[#F7F6F3] text-xs font-semibold text-[#37352F] border border-[#EDEDEB] rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-[#D4D4D0]"
                    >
                      {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Details Grid: Contact Person, Phone, Email, Thuisbezorgd */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#F7F6F3]/50 p-3 rounded-lg border border-[#EDEDEB]">
                  
                  {/* Contact Person */}
                  <div>
                    <span className="text-[11px] font-medium text-[#787774] block">Contact Person</span>
                    <span className="font-semibold text-[#37352F] flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5 text-[#9B9A97]" />
                      {details?.applicantName || lead.contact_person || 'Owner'}
                    </span>
                  </div>

                  {/* Phone */}
                  <div>
                    <span className="text-[11px] font-medium text-[#787774] block">Phone</span>
                    {lead.phone ? (
                      <a 
                        href={`tel:${lead.phone}`}
                        className="font-semibold text-[#1879B5] hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{lead.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[#9B9A97]">Not provided</span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <span className="text-[11px] font-medium text-[#787774] block">Email</span>
                    {lead.email ? (
                      <a 
                        href={`mailto:${lead.email}`}
                        className="font-semibold text-[#1879B5] hover:underline flex items-center gap-1 mt-0.5 truncate block"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </a>
                    ) : (
                      <span className="text-[#9B9A97]">Not provided</span>
                    )}
                  </div>

                  {/* Thuisbezorgd / Website */}
                  <div>
                    <span className="text-[11px] font-medium text-[#787774] block">Thuisbezorgd / Web</span>
                    {lead.website ? (
                      <a 
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#FF5A1F] hover:underline flex items-center gap-1 mt-0.5 truncate"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Thuisbezorgd Menu</span>
                      </a>
                    ) : (
                      <span className="text-[#9B9A97]">None</span>
                    )}
                  </div>

                </div>

                {/* Footer Actions: Call, WhatsApp, Email, Focus on Map, Page Peek */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  
                  <div className="flex items-center gap-2">
                    {/* Call Button */}
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1 bg-[#F7F6F3] hover:bg-[#EDEDEB] text-[#37352F] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border border-[#EDEDEB]"
                      >
                        <Phone className="w-3 h-3 text-[#FF5A1F]" />
                        <span>Call</span>
                      </a>
                    )}

                    {/* WhatsApp Button */}
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${details?.applicantName || ''}, this is Spoonful regarding your restaurant onboarding for ${lead.name}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border border-[#25D366]/30"
                      >
                        <MessageCircle className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* Email Button */}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}?subject=${encodeURIComponent(`Spoonful Onboarding - ${lead.name}`)}`}
                        className="flex items-center gap-1 bg-[#F7F6F3] hover:bg-[#EDEDEB] text-[#37352F] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border border-[#EDEDEB]"
                      >
                        <Mail className="w-3 h-3 text-[#1879B5]" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View on Map Button */}
                    <button
                      onClick={() => onNavigateToMap(lead)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#787774] hover:text-[#37352F] px-2.5 py-1.5 rounded-lg hover:bg-[#F7F6F3] transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                      <span>View on Radar</span>
                    </button>

                    {/* Open Page Peek Drawer */}
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="flex items-center gap-1 text-xs font-bold text-[#37352F] hover:text-[#FF5A1F] px-2.5 py-1.5 rounded-lg hover:bg-[#FFF1EB] transition-colors cursor-pointer"
                    >
                      <span>Open Peek</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

