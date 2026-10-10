export interface SharedMember {
  id: string;
  memberCode?: string;
  fullName: string;
  company?: string;
  position?: string;
  industry?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  tier?: string;
  status?: string;
  joinedAt?: string;
}

export interface SharedMemberProfile extends SharedMember {
  bio?: string;
  website?: string;
  taxCode?: string;
  businessAddress?: string;
  productsAndServices?: string[];
  seekingOpportunities?: string[];
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    zalo?: string;
    telegram?: string;
  };
}

export interface MemberFilterParams {
  query?: string;
  industry?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}
