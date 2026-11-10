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
