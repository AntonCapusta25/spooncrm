import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { CrmLead, LeadStage } from '../types/crm';
import { MAPBOX_TOKEN } from '../lib/supabase';
import { MapPin, Navigation, Phone, ExternalLink, Flame, CheckCircle, Star } from 'lucide-react';

interface MapViewProps {
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onCheckInLead: (lead: CrmLead) => void;
}

const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; hex: string }> = {
  discovered: { bg: 'bg-slate-500', text: 'text-slate-100', hex: '#64748b' },
  contacted: { bg: 'bg-sky-500', text: 'text-white', hex: '#0284c7' },
  meeting_scheduled: { bg: 'bg-purple-500', text: 'text-white', hex: '#9333ea' },
  contract_signed: { bg: 'bg-emerald-500', text: 'text-white', hex: '#059669' },
  pos_handover: { bg: 'bg-orange-500', text: 'text-white', hex: '#FF5A1F' },
  pos_installed: { bg: 'bg-cyan-500', text: 'text-white', hex: '#06b6d4' },
  onboarded: { bg: 'bg-green-500', text: 'text-white', hex: '#10b981' },
  lost: { bg: 'bg-rose-500', text: 'text-white', hex: '#e11d48' },
};

export const MapView: React.FC<MapViewProps> = ({ leads, onSelectLead, onCheckInLead }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeLead, setActiveLead] = useState<CrmLead | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [6.8958, 52.2215], // Enschede Center (Oude Markt)
      zoom: 13,
      pitch: 30,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update Markers based on leads and stage filter
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = leads.filter(lead => {
      if (selectedStage === 'all') return true;
      return lead.stage === selectedStage;
    });

    filtered.forEach(lead => {
      const el = document.createElement('div');
      el.className = 'group cursor-pointer relative';

      const color = STAGE_COLORS[lead.stage] || STAGE_COLORS.discovered;
      const isPosHandover = lead.stage === 'pos_handover';

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${isPosHandover ? '<div class="absolute -inset-1 rounded-full bg-orange-500/50 animate-ping"></div>' : ''}
          <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80 transition-transform group-hover:scale-125" style="background-color: ${color.hex}">
            <span class="text-[11px] font-black text-white">${isPosHandover ? '⚡' : '🍽'}</span>
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        setActiveLead(lead);
        map.flyTo({
          center: [lead.longitude, lead.latitude],
          zoom: 15.5,
          speed: 1.2
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lead.longitude, lead.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [leads, selectedStage]);

  // Locate User
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            speed: 1.2
          });

          // Add blue user pin
          const userEl = document.createElement('div');
          userEl.innerHTML = `
            <div class="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-xl animate-pulse"></div>
          `;
          new mapboxgl.Marker({ element: userEl })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        }
      },
      (err) => {
        console.error("Locate error:", err);
        alert("Could not get your location. Please ensure location permissions are enabled.");
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] overflow-hidden">
      {/* Mapbox Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Filter Pills */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 max-w-[calc(100vw-32px)]">
        <button
          onClick={() => setSelectedStage('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all ${
            selectedStage === 'all'
              ? 'bg-slate-900/90 text-white border-orange-500 shadow-lg shadow-orange-500/20'
              : 'bg-slate-900/70 text-slate-300 border-slate-700/60 hover:bg-slate-800/80'
          }`}
        >
          All Enschede ({leads.length})
        </button>

        <button
          onClick={() => setSelectedStage('pos_handover')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all ${
            selectedStage === 'pos_handover'
              ? 'bg-orange-600 text-white border-orange-400 shadow-lg shadow-orange-600/30 ring-2 ring-orange-500/50'
              : 'bg-slate-900/70 text-orange-400 border-orange-500/40 hover:bg-slate-800/80'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-300" />
          POS Handover ({leads.filter(l => l.stage === 'pos_handover').length})
        </button>

        <button
          onClick={() => setSelectedStage('contract_signed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all ${
            selectedStage === 'contract_signed'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900/70 text-emerald-400 border-emerald-500/40 hover:bg-slate-800/80'
          }`}
        >
          Signed ({leads.filter(l => l.stage === 'contract_signed').length})
        </button>

        <button
          onClick={() => setSelectedStage('meeting_scheduled')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all ${
            selectedStage === 'meeting_scheduled'
              ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
              : 'bg-slate-900/70 text-purple-400 border-purple-500/40 hover:bg-slate-800/80'
          }`}
        >
          Meetings ({leads.filter(l => l.stage === 'meeting_scheduled').length})
        </button>

        <button
          onClick={() => setSelectedStage('onboarded')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all ${
            selectedStage === 'onboarded'
              ? 'bg-green-600 text-white border-green-400 shadow-lg shadow-green-600/30'
              : 'bg-slate-900/70 text-green-400 border-green-500/40 hover:bg-slate-800/80'
          }`}
        >
          Onboarded ({leads.filter(l => l.stage === 'onboarded').length})
        </button>
      </div>

      {/* Floating GPS Button */}
      <button
        onClick={handleLocateUser}
        title="Find My Location"
        className="absolute bottom-6 right-6 z-10 w-11 h-11 rounded-2xl bg-slate-900/90 text-white border border-slate-700/80 shadow-2xl flex items-center justify-center hover:bg-orange-500 transition-all hover:scale-105"
      >
        <Navigation className="w-5 h-5" />
      </button>

      {/* Active Lead Bottom Card Popup */}
      {activeLead && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STAGE_COLORS[activeLead.stage]?.bg} text-white`}>
                  {activeLead.stage.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {activeLead.cuisine || 'Restaurant'}
                </span>
                {activeLead.rating && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {activeLead.rating}
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white truncate">
                {activeLead.name}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {activeLead.address}
              </p>
            </div>

            <button
              onClick={() => setActiveLead(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
            >
              ✕
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => onSelectLead(activeLead)}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md shadow-orange-500/20 text-center"
            >
              Open Full Lead
            </button>

            <button
              onClick={() => onCheckInLead(activeLead)}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs py-2 px-3 rounded-xl border border-slate-700 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              Check-In GPS
            </button>

            {activeLead.phone && (
              <a
                href={`tel:${activeLead.phone}`}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700"
                title="Call Restaurant"
              >
                <Phone className="w-4 h-4 text-sky-400" />
              </a>
            )}

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeLead.latitude},${activeLead.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700"
              title="Google Maps Route"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
