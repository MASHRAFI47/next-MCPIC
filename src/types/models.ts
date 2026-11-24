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
  created_at: string;
  updated_at?: string;
}

export interface BlogRecord {
  id: string;
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
}
