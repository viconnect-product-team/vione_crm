import { UserRole } from "../enums/roles.enum.js";

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserIdentity {
  id: string;
  userId: string;
  fullName: string;
  title?: string;
  companyName?: string;
  industry?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  isVerified?: boolean;
}

export interface LoginCredentials {
  identifier: string; // Email or Phone or Username
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}
