import React, { useState, useEffect, useMemo } from 'react';
import { CrmLead, CrmProfile } from './types/crm';
import { fetchLeads, fetchProfiles, supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { FilterBar, FilterState } from './components/FilterBar';
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
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [proofModalLead, setProofModalLead] = useState<CrmLead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Notion Filter State
  const [filters, setFilters] = useState<FilterState>({
    stage: 'all',
    cuisine: 'all',
    assigneeId: 'all',
    minRating: 0,
    hasPhone: false,
    hasProof: false,
    district: 'all',
    search: ''
  });

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

  // Extract unique cuisines
  const cuisines = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.cuisine) {
        l.cuisine.split(',').forEach(c => {
          const trimmed = c.trim();
          if (trimmed.length > 2 && trimmed.length < 25) set.add(trimmed);
        });
      }
    });
    return Array.from(set).slice(0, 30);
  }, [leads]);

  // Master Filter Engine (Applied across Map, Board, Table, and Dispatch)
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // 1. Stage
      if (filters.stage !== 'all' && l.stage !== filters.stage) return false;

      // 2. Cuisine
      if (filters.cuisine !== 'all' && (!l.cuisine || !l.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase()))) return false;

      // 3. Assignee
      if (filters.assigneeId === 'unassigned') {
        if (l.assignees && l.assignees.length > 0) return false;
      } else if (filters.assigneeId !== 'all') {
        if (!l.assignees?.some(a => a.id === filters.assigneeId)) return false;
      }

      // 4. Rating
      if (filters.minRating > 0 && (l.rating || 0) < filters.minRating) return false;

      // 5. Phone toggle
      if (filters.hasPhone && !l.phone) return false;

      // 6. POS Proof toggle
      if (filters.hasProof && (!l.proofs || l.proofs.length === 0)) return false;

      // 7. District
      if (filters.district !== 'all' && !l.address.includes(filters.district)) return false;

      // 8. Search query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesAddr = l.address.toLowerCase().includes(q);
        const matchesCuisine = l.cuisine && l.cuisine.toLowerCase().includes(q);
        const matchesPhone = l.phone && l.phone.includes(q);
        if (!matchesName && !matchesAddr && !matchesCuisine && !matchesPhone) return false;
      }

      return true;
    });
  }, [leads, filters]);

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
        selectedDistrict={filters.district}
        onDistrictSelect={(d) => {
          setFilters(prev => ({ ...prev, district: d }));
          setCurrentTab('map');
        }}
      />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* Top Navbar & View Tabs */}
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          searchQuery={filters.search}
          onSearchChange={(q) => setFilters(prev => ({ ...prev, search: q }))}
          posQueueCount={posHandoverCount}
          totalLeadsCount={leads.length}
          onNewLeadClick={() => {
            alert("To add a new lead, drop a pin on the map or click + New at the bottom of any Board column.");
          }}
        />

        {/* Global Notion Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          profiles={profiles}
          totalLeadsCount={leads.length}
          filteredCount={filteredLeads.length}
          cuisines={cuisines}
        />

        {/* Workspace Canvas Area */}
        <main className="flex-1 relative overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#787774]">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5A1F]" />
              <p className="text-xs font-medium">Loading Spoonful Workspace from Supabase...</p>
            </div>
          ) : (
            <>
              {currentTab === 'map' && (
                <MapView
                  leads={filteredLeads}
                  onSelectLead={setSelectedLead}
                  onCheckInLead={(lead) => setSelectedLead(lead)}
                  onOpenProofModal={setProofModalLead}
                  selectedDistrict={filters.district}
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
