import React, { useState } from 'react';
import { CrmLead, CrmProfile } from '../types/crm';
import { provisionHyperzodMerchant } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { Wrench, Camera, Zap, CheckCircle2, MapPin, Phone, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

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
  onRefresh,
  currentProfile
}) => {
  const [provisioningLeadId, setProvisioningLeadId] = useState<string | null>(null);
  const [provisionMessage, setProvisionMessage] = useState<{ id: string; success: boolean; text: string } | null>(null);

  // Filter leads in POS pipeline
  const handoverLeads = leads.filter(l => l.stage === 'pos_handover');
  const installedLeads = leads.filter(l => l.stage === 'pos_installed');
  const recentlyOnboarded = leads.filter(l => l.stage === 'onboarded').slice(0, 5);

  const handleProvision = async (lead: CrmLead) => {
    setProvisioningLeadId(lead.id);
    setProvisionMessage(null);

    const res = await provisionHyperzodMerchant(lead.id, lead.commission_rate || 12);
    setProvisioningLeadId(null);

    if (res.success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setProvisionMessage({
        id: lead.id,
        success: true,
        text: `Successfully provisioned in Hyperzod! Merchant ID: ${res.hyperzod_merchant_id}`
      });
      onRefresh();
    } else {
      setProvisionMessage({
        id: lead.id,
        success: false,
        text: res.error || 'Hyperzod provisioning failed'
      });
    }
  };

  return (
    <div className="h-[calc(100vh-65px)] overflow-y-auto p-4 md:p-6 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Hero */}
        <div className="bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-slate-900 border border-orange-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/30">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">Oleksandr's POS Integration Dispatch</h1>
                  <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase">
                    Hardware & Setup
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Deliver Sunmi POS terminals, attach counter setup photo proof, and provision merchants directly into Hyperzod.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-center">
                <div className="text-lg font-black text-orange-400">{handoverLeads.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Awaiting Setup</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-center">
                <div className="text-lg font-black text-cyan-400">{installedLeads.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ready to Provision</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Awaiting POS Delivery (pos_handover) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
              Awaiting POS Delivery & Installation ({handoverLeads.length})
            </h2>
            <span className="text-xs text-slate-400">Step 1: Install & Attach Counter Photo</span>
          </div>

          {handoverLeads.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              All caught up! No terminals waiting for installation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {handoverLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-slate-900/90 border border-orange-500/40 rounded-2xl p-5 shadow-xl hover:border-orange-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Handed to Oleksandr
                        </span>
                        <h3 className="text-base font-extrabold text-white mt-1.5">{lead.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {lead.address}
                        </p>
                      </div>

                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="bg-slate-800 hover:bg-slate-700 text-sky-400 p-2.5 rounded-xl border border-slate-700"
                          title="Call Manager"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {lead.notes && (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 my-3">
                        <span className="font-bold text-orange-400">Sales Notes:</span> {lead.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => onOpenProofModal(lead)}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      Attach Terminal Photo Proof
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lead.latitude},${lead.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold p-2.5 rounded-xl border border-slate-700"
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

        {/* SECTION 2: Proof Attached, Ready to Provision (pos_installed) */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Proof Verified — Ready for Hyperzod Provisioning ({installedLeads.length})
            </h2>
            <span className="text-xs text-slate-400">Step 2: 1-Click Provision</span>
          </div>

          {installedLeads.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
              No terminals waiting for merchant provisioning.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installedLeads.map((lead) => {
                const latestProof = lead.proofs && lead.proofs[lead.proofs.length - 1];

                return (
                  <div
                    key={lead.id}
                    className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Proof Attached
                          </span>
                          <h3 className="text-base font-extrabold text-white mt-1.5">{lead.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{lead.address}</p>
                        </div>

                        {latestProof?.photo_url && (
                          <img
                            src={latestProof.photo_url}
                            alt="POS Installation"
                            className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-500/50 shadow-md cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(latestProof.photo_url, '_blank')}
                          />
                        )}
                      </div>

                      {latestProof && (
                        <div className="text-[11px] text-slate-400 space-y-0.5 mb-3 bg-slate-950/40 p-2 rounded-lg">
                          <div><span className="text-slate-500">Terminal:</span> {latestProof.terminal_model}</div>
                          <div><span className="text-slate-500">Installer:</span> {latestProof.uploader_name}</div>
                          {latestProof.notes && <div><span className="text-slate-500">Notes:</span> {latestProof.notes}</div>}
                        </div>
                      )}

                      {provisionMessage?.id === lead.id && (
                        <div className={`p-2.5 rounded-xl text-xs mb-3 font-semibold ${
                          provisionMessage.success
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                        }`}>
                          {provisionMessage.text}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleProvision(lead)}
                      disabled={provisioningLeadId === lead.id}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      {provisioningLeadId === lead.id ? 'Creating Merchant in Hyperzod...' : '⚡ Create Merchant in Hyperzod'}
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

