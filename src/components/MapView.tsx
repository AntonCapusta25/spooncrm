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
  selectedDistrict: string;
}

const STAGE_TAGS: Record<LeadStage, { label: string; bg: string; text: string; hex: string }> = {
  discovered: { label: 'Discovered', bg: 'bg-[#E3E2E0]', text: 'text-[#5A5852]', hex: '#9B9A97' },
  contacted: { label: 'Contacted', bg: 'bg-[#D3E5EF]', text: 'text-[#1879B5]', hex: '#2383E2' },
  meeting_scheduled: { label: 'Meeting', bg: 'bg-[#E8DEEE]', text: 'text-[#8232B4]', hex: '#9065B0' },
  contract_signed: { label: 'Signed', bg: 'bg-[#DBEDDB]', text: 'text-[#286E34]', hex: '#448361' },
  pos_handover: { label: 'POS Handover', bg: 'bg-[#FFE2DD]', text: 'text-[#D44026]', hex: '#D44026' },
  pos_installed: { label: 'Proof Attached', bg: 'bg-[#D3E5EF]', text: 'text-[#0B6E99]', hex: '#0B6E99' },
  onboarded: { label: 'Live in Hyperzod', bg: 'bg-[#D4EEE2]', text: 'text-[#0F7B54]', hex: '#0F7B54' },
  lost: { label: 'Lost', bg: 'bg-[#FFE2DD]', text: 'text-[#E03E3E]', hex: '#E03E3E' },
};

export const MapView: React.FC<MapViewProps> = ({ 
  leads, 
  onSelectLead, 
  onCheckInLead,
  onOpenProofModal,
  selectedDistrict
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // States
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [activePopupLead, setActivePopupLead] = useState<CrmLead | null>(null);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (selectedStage !== 'all' && lead.stage !== selectedStage) return false;
      if (selectedCuisine !== 'all' && (!lead.cuisine || !lead.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()))) return false;
      if (selectedDistrict !== 'all' && !lead.address.includes(selectedDistrict)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesAddr = lead.address.toLowerCase().includes(q);
        const matchesCuisine = lead.cuisine && lead.cuisine.toLowerCase().includes(q);
        if (!matchesName && !matchesAddr && !matchesCuisine) return false;
      }
      return true;
    });
  }, [leads, selectedStage, selectedCuisine, selectedDistrict, search]);

  const topCuisines = ['Steakhouse', 'Pizza', 'Café', 'Restaurant', 'Grill', 'Burger', 'Bar'];

  // Initialize Mapbox with clean Notion-like Light style
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [6.8958, 52.2215], // Enschede City Center
      zoom: 13,
      pitch: 25,
      bearing: 0,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      // 1. Add District Polygons
      fetch('/enschede_pc4.geojson')
        .then(res => res.json())
        .then(geojson => {
          if (!map.getSource('enschede-districts')) {
            map.addSource('enschede-districts', {
              type: 'geojson',
              data: geojson
            });

            map.addLayer({
              id: 'districts-fill',
              type: 'fill',
              source: 'enschede-districts',
              paint: {
                'fill-color': '#37352f',
                'fill-opacity': 0.03
              }
            });

            map.addLayer({
              id: 'districts-line',
              type: 'line',
              source: 'enschede-districts',
              paint: {
                'line-color': '#787774',
                'line-width': 1.2,
                'line-opacity': 0.35,
                'line-dasharray': [3, 2]
              }
            });

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
                'text-color': '#37352f',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
              }
            });
          }
        })
        .catch(err => console.warn('Districts load error:', err));

      // 2. Add Clustered Leads
      updateMapLeadsSource(map, filteredLeads);
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update source whenever filteredLeads changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      updateMapLeadsSource(mapRef.current, filteredLeads);
    }
  }, [filteredLeads]);

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
      map.addSource('leads-source', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 40
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
            '#F7F6F3', // soft Notion warm background
            20, '#FADEC9', // Notion soft orange
            100, '#FFE2DD' // Notion soft terracotta
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            20, 22,
            100, 28
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#D4D4D0'
        }
      });

      // Cluster count number
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
          'text-color': '#37352F'
        }
      });

      // Individual Point Circle
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'leads-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'stage'],
            'pos_handover', '#D44026',
            'contract_signed', '#286E34',
            'meeting_scheduled', '#8232B4',
            'onboarded', '#0F7B54',
            '#9B9A97'
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

      // Click on cluster
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
            duration: 500
          });
        });
      });

      // Click on pin
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
            duration: 500
          });
        }
      });

      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
    }
  };

  const handleFlyToLead = (lead: CrmLead) => {
    setActivePopupLead(lead);
    // On mobile, minimize list to reveal pin on map
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lead.longitude, lead.latitude],
        zoom: 16.5,
        speed: 1.3
      });
    }
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-white text-[#37352F]">

      {/* LEFT PANE: Notion-style Lead Stream (Desktop side panel, Mobile bottom/slide drawer) */}
      <div 
        className={`fixed md:relative inset-y-0 left-0 z-30 w-full md:w-[380px] shrink-0 h-full bg-[#FFFFFF] border-r border-[#EDEDEB] flex flex-col transition-all duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 pointer-events-none'
        }`}
      >
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-[#EDEDEB] space-y-2.5 bg-[#FFFFFF]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#787774] uppercase tracking-wider">
              {filteredLeads.length} Places Found
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-[#787774] hover:text-[#37352F] text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9B9A97]" />
            <input
              type="text"
              placeholder="Filter by name, cuisine, street..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F7F6F3] text-xs text-[#37352F] pl-8 pr-2.5 py-1.5 rounded-md border border-[#EDEDEB] focus:outline-none focus:border-[#D4D4D0] placeholder-[#9B9A97]"
            />
          </div>

          {/* Stage Filter Chips */}
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStage === 'all'
                  ? 'bg-[#EFEFED] text-[#37352F] font-semibold'
                  : 'text-[#787774] hover:bg-[#F7F6F3]'
              }`}
            >
              All
            </button>

            <button
              onClick={() => setSelectedStage('pos_handover')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStage === 'pos_handover'
                  ? 'bg-[#FFE2DD] text-[#D44026]'
                  : 'text-[#787774] hover:bg-[#F7F6F3]'
              }`}
            >
              <Flame className="w-3 h-3 text-[#D44026]" />
              Handover ({leads.filter(l => l.stage === 'pos_handover').length})
            </button>

            <button
              onClick={() => setSelectedStage('contract_signed')}
              className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStage === 'contract_signed'
                  ? 'bg-[#DBEDDB] text-[#286E34] font-semibold'
                  : 'text-[#787774] hover:bg-[#F7F6F3]'
              }`}
            >
              Signed ({leads.filter(l => l.stage === 'contract_signed').length})
            </button>
          </div>

          {/* Cuisine Chips */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
            {topCuisines.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCuisine(selectedCuisine === c ? 'all' : c)}
                className={`text-[11px] px-2 py-0.5 rounded border whitespace-nowrap transition-colors ${
                  selectedCuisine === c
                    ? 'bg-[#EFEFED] text-[#37352F] border-[#D4D4D0] font-semibold'
                    : 'text-[#787774] border-[#EDEDEB] hover:bg-[#F7F6F3]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Stream Cards (Notion Page Rows) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EDEDEB] custom-scrollbar">
          {filteredLeads.map((lead) => {
            const isHandover = lead.stage === 'pos_handover';
            const isSelected = activePopupLead?.id === lead.id;
            const stageTag = STAGE_TAGS[lead.stage] || STAGE_TAGS.discovered;

            return (
              <div
                key={lead.id}
                onClick={() => handleFlyToLead(lead)}
                className={`p-3.5 hover:bg-[#F7F6F3] cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#F7F6F3] border-l-2 border-[#37352F]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${stageTag.bg} ${stageTag.text}`}>
                        {stageTag.label}
                      </span>
                      {lead.rating && (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[#37352F]">
                          <Star className="w-3 h-3 fill-[#F39C12] text-[#F39C12]" />
                          {lead.rating}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-semibold text-[#37352F] truncate">
                      {lead.name}
                    </h3>

                    <p className="text-[11px] text-[#787774] mt-0.5 truncate">
                      {lead.address}
                    </p>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-[#9B9A97] shrink-0 mt-1" />
                </div>

                {/* Quick Action buttons */}
                <div className="mt-2 pt-2 border-t border-[#EDEDEB] flex items-center justify-between">
                  <span className="text-[10px] text-[#787774] bg-[#F7F6F3] px-1.5 py-0.5 rounded">
                    {lead.cuisine || 'Food'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isHandover ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProofModal(lead);
                        }}
                        className="bg-[#FFE2DD] hover:bg-[#FAD0C8] text-[#D44026] text-[10px] font-bold px-2 py-0.5 rounded"
                      >
                        📷 Attach Proof
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="text-[11px] text-[#787774] hover:text-[#37352F]"
                      >
                        Open Page
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANE: The Mapbox Canvas */}
      <div className="flex-1 relative h-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Toggle Sidebar Button for Mobile */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 bg-white border border-[#EDEDEB] text-[#37352F] px-3 py-1.5 rounded-md text-xs font-medium shadow-sm hover:bg-[#F7F6F3]"
          >
            Show List ({filteredLeads.length})
          </button>
        )}

        {/* Active Restaurant Floating Mini Page Popup */}
        {activePopupLead && (
          <div className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-sm bg-white border border-[#EDEDEB] rounded-xl p-4 shadow-xl text-[#37352F]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${STAGE_TAGS[activePopupLead.stage]?.bg} ${STAGE_TAGS[activePopupLead.stage]?.text}`}>
                    {STAGE_TAGS[activePopupLead.stage]?.label}
                  </span>
                  <span className="text-[11px] text-[#787774]">
                    {activePopupLead.cuisine || 'Restaurant'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#37352F]">{activePopupLead.name}</h3>
                <p className="text-xs text-[#787774] mt-0.5">{activePopupLead.address}</p>
              </div>

              <button
                onClick={() => setActivePopupLead(null)}
                className="text-[#9B9A97] hover:text-[#37352F] text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-[#EDEDEB] flex items-center gap-2">
              <button
                onClick={() => onSelectLead(activePopupLead)}
                className="flex-1 bg-[#F7F6F3] hover:bg-[#EFEFED] text-[#37352F] font-semibold text-xs py-1.5 px-3 rounded border border-[#EDEDEB] transition-colors"
              >
                Open Full Page
              </button>

              <button
                onClick={() => onCheckInLead(activePopupLead)}
                className="bg-[#DBEDDB] hover:bg-[#C9E2C9] text-[#286E34] font-semibold text-xs py-1.5 px-3 rounded transition-colors"
              >
                GPS Check-in
              </button>

              {activePopupLead.phone && (
                <a
                  href={`tel:${activePopupLead.phone}`}
                  className="bg-[#F7F6F3] hover:bg-[#EFEFED] text-[#37352F] p-1.5 rounded border border-[#EDEDEB]"
                  title="Call"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
