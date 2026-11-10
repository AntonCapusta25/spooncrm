import React, { useState } from 'react';
import { CrmLead, CrmProfile } from '../types/crm';
import { provisionHyperzodMerchant } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { Wrench, Camera, Zap, CheckCircle2, MapPin, Phone, ExternalLink, Flame } from 'lucide-react';

interface PosQueueViewProps {
  leads: CrmLead[];
  onOpenProofModal: (lead: CrmLead) => void;
  onSelectLead: (lead: CrmLead) => void;
  onRefresh: () => void;
  currentProfile: CrmProfile | null;
}

export const PosQueueView: React.FC<PosQueueViewProps> = ({
  leads,
  onOpenProofModal,
  onSelectLead,
  onRefresh
}) => {
  const [provisioningLeadId, setProvisioningLeadId] = useState<string | null>(null);
  const [provisionMessage, setProvisionMessage] = useState<{ id: string; success: boolean; text: string } | null>(null);

  const handoverLeads = leads.filter(l => l.stage === 'pos_handover');
  const installedLeads = leads.filter(l => l.stage === 'pos_installed');

  const handleProvision = async (lead: CrmLead) => {
    setProvisioningLeadId(lead.id);
    setProvisionMessage(null);

    const res = await provisionHyperzodMerchant(lead.id, lead.commission_rate || 12);
    setProvisioningLeadId(null);

    if (res.success) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setProvisionMessage({
        id: lead.id,
        success: true,
        text: `Merchant created in Hyperzod! ID: ${res.hyperzod_merchant_id}`
      });
      onRefresh();
    } else {
      setProvisionMessage({
        id: lead.id,
        success: false,
        text: res.error || 'Provisioning failed'
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-white select-none text-[#37352F]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Notion Page Header */}
        <div>
          <div className="text-3xl mb-2">⚡</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#37352F]">
            Oleksandr's POS Dispatch
          </h1>
          <p className="text-xs text-[#787774] mt-1">
            Deliver Sunmi terminals, attach counter setup proof, and provision merchants directly into Hyperzod.
          </p>
        </div>

        {/* Notion Callout Block */}
        <div className="p-4 bg-[#F7F6F3] border border-[#EDEDEB] rounded-lg flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div className="text-xs text-[#787774] space-y-1">
            <span className="font-semibold text-[#37352F] block">Standard Operating Procedure:</span>
            <p>1. Check hardware model (Sunmi V2s) and test paper roll printer.</p>
            <p>2. Deliver to restaurant counter and snap a photo of the installed terminal.</p>
            <p>3. Click "⚡ Create Merchant in Hyperzod" to instantly provision the storefront.</p>
          </div>
        </div>

        {/* SECTION 1: Awaiting Installation */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-[#EDEDEB] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D44026]"></span>
              Step 1: Awaiting Hardware Installation ({handoverLeads.length})
            </h2>
          </div>

          {handoverLeads.length === 0 ? (
            <div className="p-8 text-center text-[#9B9A97] text-xs bg-[#F7F6F3] rounded-lg">
              No terminals waiting for setup. All caught up!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {handoverLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-4 bg-white border border-[#EDEDEB] hover:border-[#D4D4D0] rounded-xl hover:shadow-sm cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="bg-[#FFE2DD] text-[#D44026] text-[10px] font-bold px-1.5 py-0.2 rounded">
                        POS Handover
                      </span>
                      <h3 className="text-sm font-semibold text-[#37352F] mt-1">{lead.name}</h3>
                      <p className="text-xs text-[#787774] mt-0.5">{lead.address}</p>
                    </div>

                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded hover:bg-[#F7F6F3] text-[#1879B5]"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {lead.notes && (
                    <div className="p-2 bg-[#F7F6F3] rounded text-[11px] text-[#787774]">
                      <span className="font-semibold text-[#37352F]">Notes:</span> {lead.notes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#EDEDEB] flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProofModal(lead);
                      }}
                      className="flex-1 bg-[#FFE2DD] hover:bg-[#FAD0C8] text-[#D44026] font-bold text-xs py-1.5 px-3 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Attach Counter Photo Proof
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lead.latitude},${lead.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded hover:bg-[#F7F6F3] text-[#787774]"
                      title="Navigate"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Proof Attached, Ready for Provisioning */}
        <div className="space-y-3 pt-6">
          <div className="flex items-center justify-between border-b border-[#EDEDEB] pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0B6E99]"></span>
              Step 2: Proof Verified — Ready for Hyperzod ({installedLeads.length})
            </h2>
          </div>

          {installedLeads.length === 0 ? (
            <div className="p-6 text-center text-[#9B9A97] text-xs bg-[#F7F6F3] rounded-lg">
              No terminals waiting for merchant creation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {installedLeads.map((lead) => {
                const latestProof = lead.proofs && lead.proofs[lead.proofs.length - 1];

                return (
                  <div
                    key={lead.id}
                    className="p-4 bg-white border border-[#EDEDEB] rounded-xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="bg-[#D3E5EF] text-[#0B6E99] text-[10px] font-bold px-1.5 py-0.2 rounded">
                          Proof Attached
                        </span>
                        <h3 className="text-sm font-semibold text-[#37352F] mt-1">{lead.name}</h3>
                        <p className="text-xs text-[#787774] mt-0.5">{lead.address}</p>
                      </div>

                      {latestProof?.photo_url && (
                        <img
                          src={latestProof.photo_url}
                          alt="Proof"
                          className="w-14 h-14 rounded object-cover border border-[#EDEDEB] cursor-pointer"
                          onClick={() => window.open(latestProof.photo_url, '_blank')}
                        />
                      )}
                    </div>

                    {provisionMessage?.id === lead.id && (
                      <div className={`p-2 rounded text-xs font-medium ${
                        provisionMessage.success ? 'bg-[#D4EEE2] text-[#0F7B54]' : 'bg-[#FFE2DD] text-[#D44026]'
                      }`}>
                        {provisionMessage.text}
                      </div>
                    )}

                    <button
                      onClick={() => handleProvision(lead)}
                      disabled={provisioningLeadId === lead.id}
                      className="w-full bg-[#FF5A1F] hover:bg-[#E04B14] text-white font-semibold text-xs py-2 px-3 rounded shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      {provisioningLeadId === lead.id ? 'Creating Merchant...' : '⚡ 1-Click Provision in Hyperzod'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
