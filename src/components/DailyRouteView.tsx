import React, { useState, useEffect } from 'react';
import { CrmLead, CrmProfile, CrmVisit, CrmItineraryItem } from '../types/crm';
import { logVisit, fetchUserItinerary, addToItinerary } from '../lib/supabase';
import { Navigation, MapPin, CheckCircle, Clock, Calendar, Compass, Phone, Plus, AlertCircle } from 'lucide-react';

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
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedLeadForCheckIn, setSelectedLeadForCheckIn] = useState<string>('');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [visitOutcome, setVisitOutcome] = useState<string>('Spoke with owner, interested');

  // Load itinerary & visits
  useEffect(() => {
    if (currentProfile) {
      loadItinerary();
    }
  }, [currentProfile, leads]);

  const loadItinerary = async () => {
    if (!currentProfile) return;
    const items = await fetchUserItinerary(currentProfile.id);
    setItinerary(items);

    // Extract all visits from leads
    const allVisits = leads
      .flatMap(l => l.visits || [])
      .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime());
    setRecentVisits(allVisits.slice(0, 15));
  };

  // Get live GPS
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message || "Failed to acquire GPS");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    handleAcquireGps();
  }, []);

  // Submit GPS Check-In
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForCheckIn) {
      alert("Please select which restaurant you visited");
      return;
    }

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

  // Add a lead to today's route
  const handleAddStop = async (leadId: string) => {
    if (!currentProfile) return;
    await addToItinerary(leadId, currentProfile.id);
    loadItinerary();
  };

  return (
    <div className="h-[calc(100vh-65px)] overflow-y-auto p-4 md:p-6 bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* GPS Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Live Field GPS Tracking</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentGps ? (
                  <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Lat {currentGps.lat.toFixed(5)}, Lng {currentGps.lng.toFixed(5)} (±{currentGps.accuracy}m accuracy)
                  </span>
                ) : (
                  <span className="text-amber-400">Acquiring live location...</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleAcquireGps}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            Refresh GPS
          </button>
        </div>

        {/* 2 Column Layout: "Where He Has to Go" & "Where Person Went" */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Where to Go (Itinerary) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-extrabold text-white">Where He Has to Go (Today's Route)</h3>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {itinerary.length} Stops
              </span>
            </div>

            {/* Quick Add Stop Selector */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Add Restaurant to Today's Route:
              </label>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddStop(e.target.value);
                  }}
                  className="flex-1 bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">Choose restaurant in Enschede...</option>
                  {leads.slice(0, 50).map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.address} ({l.stage})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Itinerary List */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px] pr-1">
              {itinerary.length === 0 ? (
                <div className="h-44 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <MapPin className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-400 font-semibold">No planned visits on your route yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Select restaurants from the map or dropdown above to plan today's field route.</p>
                </div>
              ) : (
                itinerary.map((item, idx) => {
                  const lead = item.lead || leads.find(l => l.id === item.lead_id);
                  if (!lead) return null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectLead(lead)}
                      className="p-3 bg-slate-850 border border-slate-700/80 rounded-xl hover:border-slate-600 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{lead.name}</h4>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            {lead.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lead.latitude},${lead.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-400 p-2 rounded-lg border border-slate-700"
                          title="Navigate"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Check-In Form & "Where Person Went" Log */}
          <div className="space-y-6">

            {/* Check-In Action Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">Log Physical Visit / GPS Check-In</h3>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Select Restaurant Visited:
                  </label>
                  <select
                    value={selectedLeadForCheckIn}
                    onChange={(e) => setSelectedLeadForCheckIn(e.target.value)}
                    required
                    className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="">Select restaurant...</option>
                    {leads.slice(0, 100).map(l => (
                      <option key={l.id} value={l.id}>{l.name} — {l.address}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Outcome / Status:
                    </label>
                    <select
                      value={visitOutcome}
                      onChange={(e) => setVisitOutcome(e.target.value)}
                      className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="Met owner - highly interested">Met owner - highly interested</option>
                      <option value="Left flyer / card with staff">Left flyer / card with staff</option>
                      <option value="Agreed on tasting date">Agreed on tasting date</option>
                      <option value="Signed contract">Signed contract</option>
                      <option value="Delivered Sunmi POS">Delivered Sunmi POS</option>
                      <option value="Owner not present, call back">Owner not present, call back</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Quick Notes:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Owner name is John, prefers WhatsApp"
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCheckingIn}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {isCheckingIn ? 'Recording GPS Check-In...' : 'Record Visit with GPS Coordinates'}
                </button>
              </form>
            </div>

            {/* Timeline: Where Person Went */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-extrabold text-white">Where Person Went (Visit Log Timeline)</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Recent Check-ins</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {recentVisits.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No check-ins recorded yet.</p>
                ) : (
                  recentVisits.map((visit) => {
                    const lead = leads.find(l => l.id === visit.lead_id);
                    return (
                      <div
                        key={visit.id}
                        className="p-3 bg-slate-850 border border-slate-800 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{lead?.name || 'Restaurant'}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(visit.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-emerald-400 font-semibold">{visit.outcome}</p>
                        {visit.notes && <p className="text-slate-300 italic">{visit.notes}</p>}
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>By: {visit.visitor_name}</span>
                          {visit.gps_lat && (
                            <span>GPS: {visit.gps_lat.toFixed(4)}, {visit.gps_lng?.toFixed(4)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

