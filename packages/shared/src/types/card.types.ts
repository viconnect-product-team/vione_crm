export interface SharedBusinessCard {
  id: string;
  userId: string;
  slug?: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  website?: string;
  address?: string;
  taxCode?: string;
  themeStyle?: string;
  qrCodeUrl?: string;
  nfcTagId?: string;
  viewCount: number;
  tapCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SharedCardVaultItem {
  id: string;
  cardId: string;
  ownerId: string;
  fullName: string;
  company: string;
  title: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  savedAt: string;
  notes?: string;
  tags?: string[];
}
