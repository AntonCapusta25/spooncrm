import React, { useState, useEffect } from 'react';
import { CrmLead, CrmProfile } from './types/crm';
import { fetchLeads, fetchProfiles, supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { PipelineView } from './components/PipelineView';
import { TableView } from './components/TableView';
import { DailyRouteView } from './components/DailyRouteView';
import { PosQueueView } from './components/PosQueueView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { PosProofModal } from './components/PosProofModal';
import { Loader2 } from 'lucide-react';

export function App() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [profiles, setProfiles] = useState<CrmProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<CrmProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<'map' | 'pipeline' | 'table' | 'route' | 'pos_queue'>('map');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [proofModalLead, setProofModalLead] = useState<CrmLead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  // Supabase Realtime channel setup
  useEffect(() => {
    const channel = supabase
      .channel('crm_notion_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_leads' },
        () => { loadLeadsQuietly(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_pos_proofs' },
        () => { loadLeadsQuietly(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_visits' },
        () => { loadLeadsQuietly(); }
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

    if (profilesData.length > 0) {
      const oleksandr = profilesData.find(p => p.role === 'pos_installer') || profilesData[0];
      setCurrentProfile(oleksandr);
    }
    setIsLoading(false);
  };

  const loadLeadsQuietly = async () => {
    const data = await fetchLeads();
    setLeads(data);
    setSelectedLead(prev => prev ? data.find(l => l.id === prev.id) || null : null);
  };

  // Filter leads based on search query and district
  const filteredLeads = leads.filter(l => {
    if (selectedDistrict !== 'all' && !l.address.includes(selectedDistrict)) return false;
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
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#37352F] font-['Inter',sans-serif]">
      
      {/* Notion Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        profiles={profiles}
        currentProfile={currentProfile}
        onProfileChange={setCurrentProfile}
        posQueueCount={posHandoverCount}
        totalLeadsCount={leads.length}
        selectedDistrict={selectedDistrict}
        onDistrictSelect={(d) => {
          setSelectedDistrict(d);
          setCurrentTab('map');
        }}
      />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* Top Navbar & View Switcher */}
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          posQueueCount={posHandoverCount}
          totalLeadsCount={filteredLeads.length}
          onNewLeadClick={() => {
            alert("New prospect modal: You can click any restaurant on the map or in the table to edit properties.");
          }}
        />

        {/* Workspace Canvas Area */}
        <main className="flex-1 relative overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#787774]">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5A1F]" />
              <p className="text-xs font-medium">Loading Spoonful Workspace...</p>
            </div>
          ) : (
            <>
              {currentTab === 'map' && (
                <MapView
                  leads={filteredLeads}
                  onSelectLead={setSelectedLead}
                  onCheckInLead={(lead) => setSelectedLead(lead)}
                  onOpenProofModal={setProofModalLead}
                  selectedDistrict={selectedDistrict}
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

              {currentTab === 'table' && (
                <TableView
                  leads={filteredLeads}
                  onSelectLead={setSelectedLead}
                  onOpenProofModal={setProofModalLead}
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

              {currentTab === 'route' && (
                <DailyRouteView
                  leads={filteredLeads}
                  currentProfile={currentProfile}
                  onSelectLead={setSelectedLead}
                  onRefresh={loadLeadsQuietly}
                />
              )}
            </>
          )}
        </main>

      </div>

      {/* Notion Page Peek Drawer (Lead Details) */}
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

      {/* Attach POS Counter Photo Modal */}
      {proofModalLead && (
        <PosProofModal
          lead={proofModalLead}
          onClose={() => setProofModalLead(null)}
          onSuccess={() => {
            loadLeadsQuietly();
            setCurrentTab('pos_queue');
          }}
          currentProfile={currentProfile}
        />
      )}

    </div>
  );
}

export default App;
