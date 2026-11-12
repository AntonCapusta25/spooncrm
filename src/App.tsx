import React, { useState, useEffect, useMemo } from 'react';
import { CrmLead, CrmProfile, isLeadApplication } from './types/crm';
import { fetchLeads, fetchProfiles, supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { FilterBar, FilterState } from './components/FilterBar';
import { MapView } from './components/MapView';
import { PipelineView } from './components/PipelineView';
import { TableView } from './components/TableView';
import { DailyRouteView } from './components/DailyRouteView';
import { PosQueueView } from './components/PosQueueView';
import { ApplicationsView } from './components/ApplicationsView';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { LeadDetailModal } from './components/LeadDetailModal';
import { PosProofModal } from './components/PosProofModal';
import { LoginPage } from './components/LoginPage';
import { MobileTabBar } from './components/MobileTabBar';
import { Loader2 } from 'lucide-react';

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    hash.includes('admin') ||
    search.includes('admin')
  );
}

export function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);
  const [session, setSession] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [profiles, setProfiles] = useState<CrmProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<CrmProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<'map' | 'pipeline' | 'table' | 'route' | 'pos_queue' | 'applications'>('applications');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [mapFocusLead, setMapFocusLead] = useState<CrmLead | null>(null);
  const [proofModalLead, setProofModalLead] = useState<CrmLead | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync route changes between / (Homepage = Onboarding) and /admin (Internal CRM)
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

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

  // Auth Session Lifecycle
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsCheckingAuth(false);
      if (session) {
        loadData(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsCheckingAuth(false);
      if (session) {
        loadData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabase Realtime channel setup
  useEffect(() => {
    if (!session) return;

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
  }, [session]);

  const loadData = async (user?: any) => {
    setIsLoading(true);
    const [leadsData, profilesData] = await Promise.all([
      fetchLeads(),
      fetchProfiles()
    ]);
    setLeads(leadsData);
    setProfiles(profilesData);

    // Resolve profile based on authenticated user's email
    if (user?.email) {
      const matched = profilesData.find(p => p.email.toLowerCase() === user.email.toLowerCase());
      if (matched) {
        setCurrentProfile(matched);
      } else {
        // Fallback default
        setCurrentProfile({
          id: user.id,
          name: user.user_metadata?.display_name || user.email.split('@')[0],
          email: user.email,
          role: 'salesperson'
        });
      }
    } else if (profilesData.length > 0) {
      setCurrentProfile(profilesData[0]);
    }
    setIsLoading(false);
  };

  const loadLeadsQuietly = async () => {
    const data = await fetchLeads();
    setLeads(data);
    setSelectedLead(prev => prev ? data.find(l => l.id === prev.id) || null : null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentProfile(null);
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

  // Master Filter Engine
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (filters.stage !== 'all' && l.stage !== filters.stage) return false;
      if (filters.cuisine !== 'all' && (!l.cuisine || !l.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase()))) return false;
      if (filters.assigneeId === 'unassigned') {
        if (l.assignees && l.assignees.length > 0) return false;
      } else if (filters.assigneeId !== 'all') {
        if (!l.assignees?.some(a => a.id === filters.assigneeId)) return false;
      }
      if (filters.minRating > 0 && (l.rating || 0) < filters.minRating) return false;
      if (filters.hasPhone && !l.phone) return false;
      if (filters.hasProof && (!l.proofs || l.proofs.length === 0)) return false;
      if (filters.district !== 'all' && !l.address.includes(filters.district)) return false;
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
  const applicationsCount = useMemo(() => leads.filter(l => isLeadApplication(l)).length, [leads]);

  // 1. PUBLIC HOMEPAGE (/) -> The Typeform Partner Onboarding Flow!
  if (!isAdminRoute) {
    return <OnboardingFlow />;
  }

  // 2. INTERNAL ADMIN SIDE (/admin) -> Check Auth
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-2 bg-white text-[#787774]">
        <Loader2 className="w-5 h-5 animate-spin text-[#FF5A1F]" />
        <p className="text-xs font-medium">Connecting to Spoonful Ops...</p>
      </div>
    );
  }

  // 3. /admin Gated: Show Simple Notion Login if not authenticated
  if (!session) {
    return (
      <LoginPage 
        onLoginSuccess={() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) loadData(session.user);
          });
        }} 
      />
    );
  }

  // 4. Authenticated: Render Notion Workspace (/admin)
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-white text-[#37352F] font-['Inter',sans-serif]">
      
      {/* Notion Collapsible Sidebar (Drawer on Mobile, Panel on Desktop) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentProfile={currentProfile}
        posQueueCount={posHandoverCount}
        applicationsCount={applicationsCount}
        totalLeadsCount={leads.length}
        selectedDistrict={filters.district}
        onDistrictSelect={(d) => {
          setFilters(prev => ({ ...prev, district: d }));
          setCurrentTab('map');
        }}
        onLogout={handleLogout}
        onOpenOnboardingFlow={() => window.open('/', '_blank')}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
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
          applicationsCount={applicationsCount}
          totalLeadsCount={leads.length}
          onNewLeadClick={() => {
            alert("To add a new lead, drop a pin on the map or click + New at the bottom of any Board column.");
          }}
          onOpenOnboardingFlow={() => window.open('/', '_blank')}
          onMenuClick={() => setMobileMenuOpen(true)}
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
              <p className="text-xs font-medium">Loading Database...</p>
            </div>
          ) : (
            <>
              {currentTab === 'applications' && (
                <ApplicationsView
                  leads={leads}
                  profiles={profiles}
                  currentProfile={currentProfile}
                  onSelectLead={setSelectedLead}
                  onOpenProofModal={setProofModalLead}
                  onNavigateToMap={(lead) => {
                    setMapFocusLead(lead);
                    setCurrentTab('map');
                  }}
                  onRefresh={loadLeadsQuietly}
                  onOpenOnboardingFlow={() => window.open('/', '_blank')}
                />
              )}

              {currentTab === 'map' && (
                <MapView
                  leads={filteredLeads}
                  onSelectLead={setSelectedLead}
                  onCheckInLead={(lead) => setSelectedLead(lead)}
                  onOpenProofModal={setProofModalLead}
                  selectedDistrict={filters.district}
                  focusLead={mapFocusLead}
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

        {/* Mobile Bottom Navigation Bar */}
        <MobileTabBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          posQueueCount={posHandoverCount}
          applicationsCount={applicationsCount}
        />

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
