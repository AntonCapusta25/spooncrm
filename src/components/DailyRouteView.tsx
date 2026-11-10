import React, { useState, useEffect } from 'react';
import { CrmLead, CrmProfile, CrmVisit, CrmItineraryItem } from '../types/crm';
import { logVisit, fetchUserItinerary, addToItinerary } from '../lib/supabase';
import { Navigation, MapPin, CheckCircle, Clock, Calendar, Compass, Phone, Plus } from 'lucide-react';

interface DailyRouteViewProps {
  leads: CrmLead[];
  currentProfile: CrmProfile | null;
  onSelectLead: (lead: CrmLead) => void;
  onRefresh: () => void;
}

export const DailyRouteView: React.FC<DailyRouteViewProps> = ({
  leads,
  currentProfile,
  onSelectLead,
  onRefresh
}) => {
  const [itinerary, setItinerary] = useState<CrmItineraryItem[]>([]);
  const [recentVisits, setRecentVisits] = useState<CrmVisit[]>([]);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedLeadForCheckIn, setSelectedLeadForCheckIn] = useState<string>('');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [visitOutcome, setVisitOutcome] = useState<string>('Met owner, interested');

  useEffect(() => {
    if (currentProfile) {
      loadItinerary();
    }
  }, [currentProfile, leads]);

  const loadItinerary = async () => {
    if (!currentProfile) return;
    const items = await fetchUserItinerary(currentProfile.id);
    setItinerary(items);

    const allVisits = leads
      .flatMap(l => l.visits || [])
      .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime());
    setRecentVisits(allVisits.slice(0, 15));
  };

  const handleAcquireGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    handleAcquireGps();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForCheckIn) return;

    setIsCheckingIn(true);
    await logVisit({
      lead_id: selectedLeadForCheckIn,
      profile_id: currentProfile?.id,
      visitor_name: currentProfile?.name || 'Sales Rep',
      gps_lat: currentGps?.lat,
      gps_lng: currentGps?.lng,
      accuracy_meters: currentGps?.accuracy,
      visit_type: 'in_person',
      notes: visitNotes,
      outcome: visitOutcome
    });

    setVisitNotes('');
    setSelectedLeadForCheckIn('');
    setIsCheckingIn(false);
    onRefresh();
    loadItinerary();
  };

  const handleAddStop = async (leadId: string) => {
    if (!currentProfile) return;
    await addToItinerary(leadId, currentProfile.id);
    loadItinerary();
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-white select-none text-[#37352F]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Notion Page Header */}
        <div>
          <div className="text-3xl mb-2">📍</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#37352F]">
            Daily Route & Field GPS
          </h1>
          <p className="text-xs text-[#787774] mt-1">
            Track planned visits for today and record verified physical check-ins on the road.
          </p>
        </div>

        {/* GPS Status Banner */}
        <div className="p-3 bg-[#F7F6F3] border border-[#EDEDEB] rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F7B54] animate-pulse"></span>
            <span className="text-[#37352F] font-medium">
              {currentGps 
                ? `GPS Active: ${currentGps.lat.toFixed(5)}, ${currentGps.lng.toFixed(5)} (±${currentGps.accuracy}m)` 
                : 'Acquiring GPS...'}
            </span>
          </div>

          <button
            onClick={handleAcquireGps}
            className="text-[11px] font-semibold text-[#1879B5] hover:underline"
          >
            Refresh Coordinates
          </button>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Planned Stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#EDEDEB] pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#787774]">
                Where He Has to Go (Today's Route)
              </h2>
              <span className="text-xs font-mono text-[#9B9A97]">{itinerary.length} stops</span>
            </div>

            <div className="flex gap-2">
              <select
                value=""
                onChange={(e) => { if (e.target.value) handleAddStop(e.target.value); }}
                className="w-full bg-[#F7F6F3] text-xs text-[#37352F] border border-[#EDEDEB] rounded-md px-3 py-1.5 focus:outline-none"
              >
                <option value="">+ Add stop to route...</option>
                {leads.slice(0, 50).map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.address})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {itinerary.length === 0 ? (
                <div className="p-6 text-center text-[#9B9A97] text-xs bg-[#F7F6F3] rounded-lg">
                  No stops added to today's route yet.
                </div>
              ) : (
                itinerary.map((item, idx) => {
                  const lead = item.lead || leads.find(l => l.id === item.lead_id);
                  if (!lead) return null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectLead(lead)}
                      className="p-3 bg-white border border-[#EDEDEB] hover:border-[#D4D4D0] rounded-lg cursor-pointer transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#E3E2E0] text-[#37352F] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-[#37352F] truncate">{lead.name}</h4>
                          <p className="text-[11px] text-[#787774] truncate">{lead.address}</p>
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lead.latitude},${lead.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-[#1879B5] hover:bg-[#F7F6F3]"
                        title="Directions"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Record Visit & Where Person Went Log */}
          <div className="space-y-4">
            
            {/* Record Check-In */}
            <div className="p-4 bg-[#F7F6F3] border border-[#EDEDEB] rounded-lg space-y-3">
              <h3 className="text-xs font-bold text-[#37352F] uppercase tracking-wider">
                Log GPS Physical Check-In
              </h3>

              <form onSubmit={handleCheckIn} className="space-y-2.5">
                <select
                  value={selectedLeadForCheckIn}
                  onChange={(e) => setSelectedLeadForCheckIn(e.target.value)}
                  required
                  className="w-full bg-white text-xs text-[#37352F] border border-[#EDEDEB] rounded-md px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">Select restaurant visited...</option>
                  {leads.slice(0, 80).map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>

                <select
                  value={visitOutcome}
                  onChange={(e) => setVisitOutcome(e.target.value)}
                  className="w-full bg-white text-xs text-[#37352F] border border-[#EDEDEB] rounded-md px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="Met owner - highly interested">Met owner - highly interested</option>
                  <option value="Agreed on tasting date">Agreed on tasting date</option>
                  <option value="Contract signed">Contract signed</option>
                  <option value="Delivered Sunmi POS">Delivered Sunmi POS</option>
                  <option value="Left flyer / card with staff">Left flyer with staff</option>
                </select>

                <input
                  type="text"
                  placeholder="Visit notes (e.g. manager Marco requested 12%)..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full bg-white text-xs text-[#37352F] border border-[#EDEDEB] rounded-md px-2.5 py-1.5 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isCheckingIn}
                  className="w-full bg-[#37352F] hover:bg-[#201F1D] text-white font-medium text-xs py-1.5 px-3 rounded transition-colors"
                >
                  {isCheckingIn ? 'Recording...' : 'Record Visit with GPS'}
                </button>
              </form>
            </div>

            {/* Timeline: Where Person Went */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#787774] uppercase tracking-wider">
                Where Person Went (Timeline)
              </h3>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recentVisits.map((v) => {
                  const lead = leads.find(l => l.id === v.lead_id);
                  return (
                    <div key={v.id} className="p-2.5 bg-[#F7F6F3] rounded text-xs space-y-0.5">
                      <div className="flex items-center justify-between text-[#787774] text-[11px]">
                        <span className="font-semibold text-[#37352F]">{lead?.name || 'Restaurant'}</span>
                        <span>{new Date(v.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[#0F7B54] font-medium">{v.outcome}</p>
                      {v.notes && <p className="text-[#5A5852]">{v.notes}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
