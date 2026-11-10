import React, { useState, useEffect } from 'react';
import { CrmLead, CrmProfile } from './types/crm';
import { fetchLeads, fetchProfiles, supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { PipelineView } from './components/PipelineView';
import { DailyRouteView } from './components/DailyRouteView';
import { PosQueueView } from './components/PosQueueView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { PosProofModal } from './components/PosProofModal';
import { Loader2 } from 'lucide-react';

export function App() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [profiles, setProfiles] = useState<CrmProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<CrmProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<'map' | 'pipeline' | 'route' | 'pos_queue'>('map');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [proofModalLead, setProofModalLead] = useState<CrmLead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Supabase Realtime channel setup for CRM collaboration
  useEffect(() => {
    const channel = supabase
      .channel('crm_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_leads' },
        () => {
          loadLeadsQuietly();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_pos_proofs' },
        () => {
          loadLeadsQuietly();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_visits' },
        () => {
          loadLeadsQuietly();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [leadsData, profilesData] = await Promise.all([
      fetchLeads(),
      fetchProfiles()
    ]);
    setLeads(leadsData);
    setProfiles(profilesData);

    // Default current profile to Oleksandr or first profile
    if (profilesData.length > 0) {
      const oleksandr = profilesData.find(p => p.role === 'pos_installer') || profilesData[0];
      setCurrentProfile(oleksandr);
    }
    setIsLoading(false);
  };

  const loadLeadsQuietly = async () => {
    const data = await fetchLeads();
    setLeads(data);
    // Keep selected lead synchronized
    setSelectedLead(prev => prev ? data.find(l => l.id === prev.id) || null : null);
  };

  // Filtered leads based on search query
  const filteredLeads = leads.filter(l => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.cuisine && l.cuisine.toLowerCase().includes(q)) ||
      l.address.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q))
    );
  });

  const posHandoverCount = leads.filter(l => l.stage === 'pos_handover').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        profiles={profiles}
        currentProfile={currentProfile}
        onProfileChange={setCurrentProfile}
        posQueueCount={posHandoverCount}
        totalLeadsCount={leads.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-65px)] gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold tracking-wide">
              Loading Spoonful Enschede Sales Engine...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'map' && (
              <MapView
                leads={filteredLeads}
                onSelectLead={setSelectedLead}
                onOpenProofModal={setProofModalLead}
                onCheckInLead={(lead) => {
                  setSelectedLead(lead);
                }}
              />
            )}

            {currentTab === 'pipeline' && (
              <PipelineView
                leads={filteredLeads}
                onSelectLead={setSelectedLead}
                onOpenProofModal={setProofModalLead}
                onRefresh={loadLeadsQuietly}
                currentProfile={currentProfile}
              />
            )}

            {currentTab === 'route' && (
              <DailyRouteView
                leads={filteredLeads}
                currentProfile={currentProfile}
                onSelectLead={setSelectedLead}
                onRefresh={loadLeadsQuietly}
              />
            )}

            {currentTab === 'pos_queue' && (
              <PosQueueView
                leads={filteredLeads}
                onOpenProofModal={setProofModalLead}
                onSelectLead={setSelectedLead}
                onRefresh={loadLeadsQuietly}
                currentProfile={currentProfile}
              />
            )}
          </>
        )}
      </main>

      {/* Detail Slide-Over Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={loadLeadsQuietly}
          onOpenProofModal={setProofModalLead}
          profiles={profiles}
          currentProfile={currentProfile}
        />
      )}

      {/* Oleksandr's POS Proof Upload Modal */}
      {proofModalLead && (
        <PosProofModal
          lead={proofModalLead}
          onClose={() => setProofModalLead(null)}
          onSuccess={() => {
            loadLeadsQuietly();
            // Switch to POS queue to see it ready for provisioning
            setCurrentTab('pos_queue');
          }}
          currentProfile={currentProfile}
        />
      )}
    </div>
  );
}

export default App;

