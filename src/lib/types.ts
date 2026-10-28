import type { Gender, Goal, Tier } from "./config";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  date_of_birth: string;
  display_name: string;
  gender: Gender;
  district: string;
  town: string | null;
  bio: string | null;
  interests: string[];
  relationship_goal: Goal | null;
  lifestyle: Record<string, string>;
  photos: string[];
  profile_completed: boolean;
  show_town: boolean;
  show_online: boolean;
  photo_visibility: "members" | "matches";
  is_paused: boolean;
  is_deactivated: boolean;
  is_suspended: boolean;
  suspended_reason: string | null;
  last_seen_at: string | null;
  created_at: string;
}

export interface Preferences {
  user_id: string;
  seeking_gender: Gender | null;
  min_age: number;
  max_age: number;
  preferred_districts: string[];
  preferred_goal: Goal | null;
}

/** Safe public card returned by member_card() on the server */
export interface MemberCard {
  id: string;
  display_name: string;
  age: number;
  gender: Gender;
  district: string;
  town: string | null;
  relationship_goal: Goal | null;
  interests: string[];
  bio: string;
  photo: string | null;
  online: boolean;
  is_favorite: boolean;
  i_liked: boolean;
  score?: number;
  reasons?: string[];
  [extra: string]: unknown;
}

export interface Package {
  code: string;
  name: string;
  tier: Tier;
  price_ugx: number;
  duration_days: number;
  audience: string | null;
  benefits: string[];
  is_active: boolean;
  sort_order: number;
}

export interface Payment {
  id: string;
  user_id: string | null;
  package_code: string;
  package_name: string;
  tier: Tier;
  amount_ugx: number;
  duration_days: number;
  network: "mtn" | "airtel";
  transaction_ref: string;
  payer_phone: string;
  receipt_path: string | null;
  user_note: string | null;
  status: "pending" | "approved" | "rejected" | "refunded";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  [extra: string]: unknown;
}

export interface SubscriptionRow {
  id: string;
  package_code: string;
  package_name: string;
  tier: Tier;
  starts_at: string;
  expires_at: string;
  status: "active" | "scheduled" | "expired" | "revoked";
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}
