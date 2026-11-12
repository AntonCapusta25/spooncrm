export type LeadStage = 
  | 'discovered' 
  | 'contacted' 
  | 'meeting_scheduled' 
  | 'contract_signed' 
  | 'pos_handover' 
  | 'pos_installed' 
  | 'onboarded' 
  | 'lost';

export type UserRole = 'salesperson' | 'pos_installer' | 'admin';

export interface CrmProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
}

export interface CrmLead {
  id: string;
  name: string;
  cuisine: string | null;
  rating: number;
  reviews_count: number;
  price_level: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
  maps_url: string | null;
  stage: LeadStage;
  status: 'active' | 'won' | 'lost' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes: string | null;
  hyperzod_merchant_id: string | null;
  contact_person: string | null;
  commission_rate: number;
  created_at: string;
  updated_at: string;
  assignees?: CrmProfile[];
  proofs?: CrmPosProof[];
  visits?: CrmVisit[];
}

export interface CrmVisit {
  id: string;
  lead_id: string;
  profile_id?: string;
  visitor_name: string;
  visited_at: string;
  gps_lat?: number;
  gps_lng?: number;
  accuracy_meters?: number;
  visit_type: 'in_person' | 'call' | 'email' | 'meeting';
  notes?: string;
  outcome?: string;
}

export interface CrmItineraryItem {
  id: string;
  lead_id: string;
  profile_id: string;
  scheduled_date: string;
  sequence_order: number;
  status: 'pending' | 'completed' | 'skipped';
  notes?: string;
  lead?: CrmLead;
}

export interface CrmPosProof {
  id: string;
  lead_id: string;
  uploaded_by?: string;
  uploader_name: string;
  photo_url: string;
  terminal_model: string;
  terminal_serial?: string;
  notes?: string;
  installed_at: string;
}

export interface OnboardingApplicationData {
  restaurantName: string;
  thuisbezorgdUrl?: string;
  contactPerson: string;
  role?: string;
  phone: string;
  email: string;
  hasOwnDelivery?: string;
  preferredContact?: 'call' | 'whatsapp' | 'email';
  matchedLeadId?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export function isLeadApplication(lead: CrmLead): boolean {
  return Boolean(
    (lead.notes && lead.notes.includes('[INBOUND_APPLICATION]')) ||
    (lead.contact_person && (lead.notes?.toLowerCase().includes('application') || lead.notes?.toLowerCase().includes('thuisbezorgd')))
  );
}

export function parseApplicationDetails(lead: CrmLead) {
  if (!isLeadApplication(lead) || !lead.notes) return null;
  
  const text = lead.notes;
  const applicantMatch = text.match(/Applicant:\s*([^|\n]+)/i);
  const phoneMatch = text.match(/Phone:\s*([^|\n]+)/i);
  const emailMatch = text.match(/Email:\s*([^|\n]+)/i);
  const thuisbezorgdMatch = text.match(/Thuisbezorgd:\s*([^|\n]+)/i);
  const deliveryMatch = text.match(/Delivery:\s*([^|\n]+)/i);
  const dateMatch = text.match(/Date:\s*([^|\n]+)/i);
  const contactPrefMatch = text.match(/Preference:\s*([^|\n]+)/i);

  return {
    applicantName: applicantMatch ? applicantMatch[1].trim() : lead.contact_person || 'Partner',
    phone: phoneMatch ? phoneMatch[1].trim() : lead.phone || '',
    email: emailMatch ? emailMatch[1].trim() : lead.email || '',
    thuisbezorgdUrl: thuisbezorgdMatch && thuisbezorgdMatch[1].trim() !== 'N/A' ? thuisbezorgdMatch[1].trim() : lead.website || '',
    hasOwnDelivery: deliveryMatch ? deliveryMatch[1].trim() : '',
    date: dateMatch ? dateMatch[1].trim() : lead.updated_at,
    contactPreference: contactPrefMatch ? contactPrefMatch[1].trim() : 'call'
  };
}


