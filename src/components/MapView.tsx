import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { CrmLead, LeadStage } from '../types/crm';
import { MAPBOX_TOKEN } from '../lib/supabase';
import { 
  Search, Filter, Flame, Star, MapPin, Phone, ExternalLink, 
  Layers, Navigation, Compass, ChevronRight, X, Sparkles, Building2
} from 'lucide-react';

interface MapViewProps {
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onCheckInLead: (lead: CrmLead) => void;
  onOpenProofModal: (lead: CrmLead) => void;
}

const STAGE_CONFIG: Record<LeadStage, { label: string; color: string; hex: string }> = {
  discovered: { label: 'Discovered', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', hex: '#64748b' },
  contacted: { label: 'Contacted', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30', hex: '#0284c7' },
  meeting_scheduled: { label: 'Meeting', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', hex: '#9333ea' },
  contract_signed: { label: 'Signed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', hex: '#059669' },
  pos_handover: { label: 'POS Handover', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', hex: '#FF5A1F' },
  pos_installed: { label: 'Proof Attached', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', hex: '#06b6d4' },
  onboarded: { label: 'Live', color: 'bg-green-500/20 text-green-300 border-green-500/30', hex: '#10b981' },
  lost: { label: 'Lost', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', hex: '#e11d48' },
};

const MAP_STYLES = [
  { id: 'navigation', name: 'Night Radar', url: 'mapbox://styles/mapbox/navigation-night-v1' },
  { id: 'dark', name: 'Dark Slate', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'streets', name: 'Streets Clear', url: 'mapbox://styles/mapbox/streets-v12' },
];

export const MapView: React.FC<MapViewProps> = ({ 
  leads, 
  onSelectLead, 
  onCheckInLead,
  onOpenProofModal
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // States
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [mapStyleUrl, setMapStyleUrl] = useState<string>('mapbox://styles/mapbox/navigation-night-v1');
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [hoveredLeadId, setHoveredLeadId] = useState<string | null>(null);
  const [activePopupLead, setActivePopupLead] = useState<CrmLead | null>(null);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (selectedStage !== 'all' && lead.stage !== selectedStage) return false;
      if (selectedCuisine !== 'all' && (!lead.cuisine || !lead.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()))) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesAddr = lead.address.toLowerCase().includes(q);
        const matchesCuisine = lead.cuisine && lead.cuisine.toLowerCase().includes(q);
        if (!matchesName && !matchesAddr && !matchesCuisine) return false;
      }
      return true;
    });
  }, [leads, selectedStage, selectedCuisine, search]);

  // Cuisine pills extraction
  const topCuisines = ['Steakhouse', 'Pizza', 'Café', 'Restaurant', 'Grill', 'Burger', 'Bar'];

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyleUrl,
      center: [6.8958, 52.2215], // Enschede City Center
      zoom: 13,
      pitch: 35,
      bearing: -10,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      // 1. Add District Polygons (enschede_pc4.geojson)
      fetch('/enschede_pc4.geojson')
        .then(res => res.json())
        .then(geojson => {
          if (!map.getSource('enschede-districts')) {
            map.addSource('enschede-districts', {
              type: 'geojson',
              data: geojson
            });

            // Fill layer with subtle tint
            map.addLayer({
              id: 'districts-fill',
              type: 'fill',
              source: 'enschede-districts',
              paint: {
                'fill-color': '#f97316',
                'fill-opacity': 0.04
              }
            });

            // Glowing border
            map.addLayer({
              id: 'districts-line',
              type: 'line',
              source: 'enschede-districts',
              paint: {
                'line-color': '#f97316',
                'line-width': 1.5,
                'line-opacity': 0.35,
                'line-dasharray': [2, 1]
              }
            });

            // District Labels
            map.addLayer({
              id: 'districts-label',
              type: 'symbol',
              source: 'enschede-districts',
              layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': 11,
                'text-offset': [0, 0],
                'text-anchor': 'center'
              },
              paint: {
                'text-color': '#cbd5e1',
                'text-halo-color': '#0f172a',
                'text-halo-width': 2,
                'text-opacity': 0.85
              }
            });
          }
        })
        .catch(err => console.warn('Districts load error:', err));

      // 2. Add Leads GeoJSON source with native high-performance clustering
      updateMapLeadsSource(map, filteredLeads);
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [mapStyleUrl]);

  // Update source whenever filteredLeads changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateMapLeadsSource(mapRef.current, filteredLeads);
    }
  }, [filteredLeads]);

  // Toggle district visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const visibility = showDistricts ? 'visible' : 'none';
    if (map.getLayer('districts-fill')) map.setLayoutProperty('districts-fill', 'visibility', visibility);
    if (map.getLayer('districts-line')) map.setLayoutProperty('districts-line', 'visibility', visibility);
    if (map.getLayer('districts-label')) map.setLayoutProperty('districts-label', 'visibility', visibility);
  }, [showDistricts]);

  // Helper to sync GeoJSON points & clusters
  const updateMapLeadsSource = (map: mapboxgl.Map, currentLeads: CrmLead[]) => {
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: currentLeads.map(l => ({
        type: 'Feature',
        id: l.id,
        properties: {
          id: l.id,
          name: l.name,
          cuisine: l.cuisine || 'Restaurant',
          rating: l.rating || 4.5,
          reviews_count: l.reviews_count || 0,
          address: l.address,
          phone: l.phone || '',
          stage: l.stage,
          is_handover: l.stage === 'pos_handover' ? 1 : 0
        },
        geometry: {
          type: 'Point',
          coordinates: [l.longitude, l.latitude]
        }
      }))
    };

    if (map.getSource('leads-source')) {
      (map.getSource('leads-source') as mapboxgl.GeoJSONSource).setData(geojsonData);
    } else {
      // Add source with clustering enabled
      map.addSource('leads-source', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 45
      });

      // Cluster glowing background
      map.addLayer({
        id: 'clusters-glow',
        type: 'circle',
        source: 'leads-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#f97316',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            26,
            20, 32,
            100, 42
          ],
          'circle-opacity': 0.25,
          'circle-blur': 0.8
        }
      });

      // Cluster core circle
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'leads-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#c2410c', // orange-700
            15, '#ea580c', // orange-600
            50, '#f97316', // orange-500
            150, '#FF5A1F' // signature Spoonful brand
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            20, 22,
            100, 28
          ],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Cluster number label
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'leads-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Unclustered Point Outer Glow (for POS Handover)
      map.addLayer({
        id: 'unclustered-handover-glow',
        type: 'circle',
        source: 'leads-source',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'stage'], 'pos_handover']],
        paint: {
          'circle-color': '#FF5A1F',
          'circle-radius': 14,
          'circle-opacity': 0.5,
          'circle-blur': 0.6
        }
      });

      // Unclustered Point Core
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'leads-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'stage'],
            'pos_handover', '#FF5A1F',
            'contract_signed', '#10B981',
            'meeting_scheduled', '#8B5CF6',
            'pos_installed', '#06B6D4',
            'onboarded', '#059669',
            '#64748B' // default discovered
          ],
          'circle-radius': [
            'match',
            ['get', 'stage'],
            'pos_handover', 8,
            6
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Click on cluster zooms smoothly into bounds
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource('leads-source') as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !features[0]?.geometry) return;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.easeTo({
            center: [coords[0], coords[1]],
            zoom: zoom || 15,
            duration: 700
          });
        });
      });

      // Click on individual restaurant pin
      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const leadId = feature.properties?.id;
        const lead = currentLeads.find(l => l.id === leadId);
        if (lead) {
          setActivePopupLead(lead);
          map.easeTo({
            center: [lead.longitude, lead.latitude],
            zoom: 16,
            duration: 600
          });
        }
      });

      // Cursor pointer on interactive items
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
    }
  };

  // Fly to restaurant from sidebar
  const handleFlyToLead = (lead: CrmLead) => {
    setActivePopupLead(lead);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lead.longitude, lead.latitude],
        zoom: 16.5,
        pitch: 45,
        speed: 1.4,
        curve: 1.2
      });
    }
  };

  // Locate User GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15.5,
            pitch: 30,
            speed: 1.2
          });
          const el = document.createElement('div');
          el.className = 'w-6 h-6 rounded-full bg-sky-500 border-2 border-white shadow-2xl flex items-center justify-center animate-pulse';
          el.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-white"></div>';
          new mapboxgl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        }
      },
      (err) => alert("Could not fetch location: " + err.message),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] flex overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">

      {/* LEFT SPLIT PANE: Restaurant Radar Feed (Desktop Sidebar) */}
      <div 
        className={`w-full md:w-[420px] shrink-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col z-20 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 pointer-events-none'
        }`}
      >
        {/* Search & Top Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-900/90">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <span>Enschede Field Radar</span>
                <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  {filteredLeads.length} Leads
                </span>
              </h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, street, or cuisine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 text-xs text-slate-100 pl-9 pr-8 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-500 font-medium"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Stage Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedStage === 'all'
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              All ({leads.length})
            </button>

            <button
              onClick={() => setSelectedStage('pos_handover')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all ${
                selectedStage === 'pos_handover'
                  ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/25 ring-2 ring-orange-500/40'
                  : 'bg-orange-950/40 text-orange-400 border-orange-500/40 hover:bg-orange-900/60'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-300" />
              Handed to Oleksandr ({leads.filter(l => l.stage === 'pos_handover').length})
            </button>

            <button
              onClick={() => setSelectedStage('contract_signed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all ${
                selectedStage === 'contract_signed'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/25'
                  : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/40'
              }`}
            >
              Signed ({leads.filter(l => l.stage === 'contract_signed').length})
            </button>

            <button
              onClick={() => setSelectedStage('meeting_scheduled')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all ${
                selectedStage === 'meeting_scheduled'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/25'
                  : 'bg-purple-950/30 text-purple-400 border-purple-500/40 hover:bg-purple-900/40'
              }`}
            >
              Meetings ({leads.filter(l => l.stage === 'meeting_scheduled').length})
            </button>
          </div>

          {/* Cuisine Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                selectedCuisine === 'all' ? 'text-orange-400 underline decoration-2' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Any Cuisine
            </button>
            {topCuisines.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(selectedCuisine === c ? 'all' : c)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all whitespace-nowrap ${
                  selectedCuisine === c
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Stream Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {filteredLeads.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-medium">
              No matching restaurants in Enschede
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const isHandover = lead.stage === 'pos_handover';
              const isSelected = activePopupLead?.id === lead.id;
              const stageBadge = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.discovered;

              return (
                <div
                  key={lead.id}
                  onClick={() => handleFlyToLead(lead)}
                  onMouseEnter={() => setHoveredLeadId(lead.id)}
                  onMouseLeave={() => setHoveredLeadId(null)}
                  className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-orange-500 ring-2 ring-orange-500/40 shadow-xl'
                      : isHandover
                      ? 'bg-gradient-to-r from-orange-950/40 to-slate-900 border-orange-500/50 hover:border-orange-400 ring-1 ring-orange-500/20 shadow-md'
                      : 'bg-slate-900/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageBadge.color}`}>
                          {stageBadge.label}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                          {lead.cuisine || 'Restaurant'}
                        </span>
                        {lead.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 ml-auto">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {lead.rating}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-black text-white group-hover:text-orange-400 transition-colors truncate">
                        {lead.name}
                      </h3>

                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        {lead.address}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Actions Bar inside Card */}
                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-800 hover:bg-slate-700 text-sky-400 p-1.5 rounded-lg border border-slate-700 text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckInLead(lead);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 p-1.5 rounded-lg border border-slate-700 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        GPS Check-in
                      </button>
                    </div>

                    {isHandover ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProofModal(lead);
                        }}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-sm"
                      >
                        ⚡ Attach Proof
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="text-slate-400 hover:text-white font-bold text-[10px] underline"
                      >
                        Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: The Mapbox Interactive Canvas */}
      <div className="flex-1 relative h-full">

        {/* Mapbox Div */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Toggle Sidebar Button for Mobile / Collapsed Desktop */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 bg-slate-900/90 text-white border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 hover:bg-orange-500 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Show Restaurant List ({filteredLeads.length})
          </button>
        )}

        {/* Floating Map Controls Top-Right */}
        <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2">
          {/* Style Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 flex items-center shadow-2xl">
            {MAP_STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setMapStyleUrl(s.url)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  mapStyleUrl === s.url
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* District Borders Toggle */}
          <button
            onClick={() => setShowDistricts(!showDistricts)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border backdrop-blur-md shadow-xl transition-all flex items-center gap-1.5 ${
              showDistricts
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Districts
          </button>

          {/* Locate Me GPS */}
          <button
            onClick={handleLocateMe}
            className="w-8 h-8 rounded-xl bg-slate-900/90 text-white border border-slate-800 shadow-xl flex items-center justify-center hover:bg-orange-500 transition-colors"
            title="Locate My Position"
          >
            <Navigation className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        {/* Active Restaurant Floating Card on Map Bottom */}
        {activePopupLead && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl shadow-black/90 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STAGE_CONFIG[activePopupLead.stage]?.color}`}>
                    {STAGE_CONFIG[activePopupLead.stage]?.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    {activePopupLead.cuisine || 'Restaurant'}
                  </span>
                  {activePopupLead.rating && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {activePopupLead.rating} ({activePopupLead.reviews_count || 0})
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-white truncate">
                  {activePopupLead.name}
                </h3>

                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {activePopupLead.address}
                </p>
              </div>

              <button
                onClick={() => setActivePopupLead(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
              <button
                onClick={() => onSelectLead(activePopupLead)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all shadow-md shadow-orange-500/25 text-center"
              >
                Open Full Lead
              </button>

              <button
                onClick={() => onCheckInLead(activePopupLead)}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                Check-In GPS
              </button>

              {activePopupLead.phone && (
                <a
                  href={`tel:${activePopupLead.phone}`}
                  className="bg-slate-800 hover:bg-slate-700 text-sky-400 p-2 rounded-xl border border-slate-700"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activePopupLead.latitude},${activePopupLead.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700"
                title="Directions"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
