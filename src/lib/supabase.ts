import { createClient } from '@supabase/supabase-js';
import { CrmLead, CrmProfile, CrmVisit, CrmPosProof, CrmItineraryItem, LeadStage } from '../types/crm';

export const SUPABASE_URL = "https://qttdcibitumvwsrxqeld.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dGRjaWJpdHVtdndzcnhxZWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI5NDUzNSwiZXhwIjoyMDk2ODcwNTM1fQ.JpDFwAdN-kRzhRWSQcfVZVKJjnDfGb1fZ6M52iWP0OA";
export const MAPBOX_TOKEN = "pk.eyJ1IjoiaHlwZXJ6b2R0ZWNoIiwiYSI6ImNta3phOGhxbTBnZWczZm9ka2I1NGd3aTIifQ.ngexVRNk9qKrjIBvoT2s6g";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch all profiles
export async function fetchProfiles(): Promise<CrmProfile[]> {
  const { data, error } = await supabase
    .from('crm_profiles')
    .select('*')
    .order('name');
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  return data || [];
}

// Fetch all leads with assignees and proofs
export async function fetchLeads(): Promise<CrmLead[]> {
  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select(`
      *,
      crm_lead_assignees (
        profile_id,
        crm_profiles (*)
      ),
      crm_pos_proofs (*),
      crm_visits (*)
    `)
    .range(0, 999)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }

  return (leads || []).map((lead: any) => ({
    ...lead,
    assignees: lead.crm_lead_assignees?.map((a: any) => a.crm_profiles).filter(Boolean) || [],
    proofs: lead.crm_pos_proofs || [],
    visits: lead.crm_visits || []
  }));
}

// Update Lead Stage
export async function updateLeadStage(leadId: string, stage: LeadStage): Promise<boolean> {
  const { error } = await supabase
    .from('crm_leads')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', leadId);
  return !error;
}

// Update Lead Details
export async function updateLead(leadId: string, updates: Partial<CrmLead>): Promise<boolean> {
  const { error } = await supabase
    .from('crm_leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', leadId);
  return !error;
}

// Toggle Assignee for Lead (Multi-assignee support)
export async function toggleLeadAssignee(leadId: string, profileId: string, isAssigned: boolean): Promise<boolean> {
  if (isAssigned) {
    const { error } = await supabase
      .from('crm_lead_assignees')
      .delete()
      .eq('lead_id', leadId)
      .eq('profile_id', profileId);
    return !error;
  } else {
    const { error } = await supabase
      .from('crm_lead_assignees')
      .insert({ lead_id: leadId, profile_id: profileId });
    return !error;
  }
}

// Log a Visit (GPS physical check-in or call)
export async function logVisit(visit: Omit<CrmVisit, 'id' | 'visited_at'>): Promise<CrmVisit | null> {
  const { data, error } = await supabase
    .from('crm_visits')
    .insert({
      ...visit,
      visited_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging visit:', error);
    return null;
  }
  return data;
}

// Upload POS Counter Photo Proof (by Oleksandr)
export async function uploadPosProof(
  leadId: string, 
  file: File, 
  uploaderName: string, 
  notes?: string,
  terminalModel: string = 'Sunmi V2s'
): Promise<CrmPosProof | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${leadId}-${Date.now()}.${fileExt}`;
  const filePath = `proofs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('pos-proofs')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('pos-proofs')
    .getPublicUrl(filePath);

  const { data: proof, error: insertError } = await supabase
    .from('crm_pos_proofs')
    .insert({
      lead_id: leadId,
      photo_url: publicUrl,
      uploader_name: uploaderName,
      terminal_model: terminalModel,
      notes: notes,
      installed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('Insert proof record error:', insertError);
    return null;
  }

  // Update lead stage to pos_installed
  await updateLeadStage(leadId, 'pos_installed');

  return proof;
}

// Provision Merchant in Hyperzod
export async function provisionHyperzodMerchant(leadId: string, commissionRate: number = 12): Promise<{ success: boolean; message: string; hyperzod_merchant_id?: string; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/crm-create-merchant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        lead_id: leadId,
        commission_rate: commissionRate
      })
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    return { success: false, message: 'Network request failed', error: err.message };
  }
}

// Fetch Itinerary for User
export async function fetchUserItinerary(profileId: string): Promise<CrmItineraryItem[]> {
  const { data, error } = await supabase
    .from('crm_itinerary')
    .select(`
      *,
      lead:crm_leads (*)
    `)
    .eq('profile_id', profileId)
    .order('sequence_order');

  if (error) {
    console.error('Error fetching itinerary:', error);
    return [];
  }
  return data || [];
}

// Add lead to today's itinerary
export async function addToItinerary(leadId: string, profileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('crm_itinerary')
    .insert({
      lead_id: leadId,
      profile_id: profileId,
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    });
  return !error;
}

