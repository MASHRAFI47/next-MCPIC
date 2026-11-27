export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentRecord {
  id: string;
  event_id: string;
  event_name?: string;
  event_slug?: string;
  name: string;
  description: string;
  image_url: string;
  start_date: string;
  end_date: string;
  registration_open?: boolean;
  registration_deadline?: string | null;
  max_participants?: number | null;
  is_team_based?: boolean;
  max_team_size?: number;
  confirmed_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface BlogRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  publisher_id?: string | null;
  publisher_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  image_url: string;
  role: "member" | "admin";
  designation: string;
  email_verified_at: string | null;
  mfa_enabled: boolean;
  created_at: string;
}

export interface ExecutiveApplicationRecord {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  image_url?: string;
  why_executive: string;
  hours_per_week: string;
  tech_skills: string;
  experience: string;
  leadership_rating: string;
  github_profile: string;
  awards: string;
  status: "pending" | "recruited" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  usersCount: number;
  eventsCount: number;
  blogsCount: number;
  recruitFormCount: number;
  unreadMessagesCount?: number;
  registrationsCount?: number;
}

export interface SegmentRegistrationRecord {
  id: string;
  ticket_code: string;
  segment_id: string;
  segment_name?: string;
  event_name?: string;
  event_slug?: string;
  user_id: string | null;
  participant_name: string;
  email: string;
  phone: string;
  institution: string;
  class_grade: string;
  team_name: string | null;
  team_members: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
  updated_at?: string;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "unread" | "read" | "resolved";
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ExecutiveMemberRecord {
  id: string;
  panel_year: string;
  name: string;
  post: string;
  image_url: string;
  display_order: number;
  created_at?: string;
}

export interface AchievementRecord {
  id: string;
  title: string;
  tag: string;
  image_url: string;
  year: string | null;
  display_order: number;
  created_at?: string;
}
