import { 
  ProfileType, 
  ProfileStatus, 
  ProfileSessionStatus, 
  UserRole, 
  OTPType 
} from '../generated/prisma';

// Profile interfaces
export interface Profile {
  id: string;
  name: string;
  type: ProfileType;
  status: ProfileStatus;
  description?: string;
  avatar?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  members?: ProfileMember[];
  customerProfile?: CustomerProfile;
  artisanProfile?: ArtisanProfile;
}

export interface ProfileMember {
  id: string;
  profileId: string;
  userId: string;
  role: UserRole;
  permissions?: Record<string, any>;
  isActive: boolean;
  joinedAt: Date;
  profile?: Profile;
  user?: User;
}

export interface ProfileSession {
  id: string;
  profileId: string;
  userId: string;
  token: string;
  refreshToken: string;
  status: ProfileSessionStatus;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
  user?: User;
}

export interface ProfileInvitation {
  id: string;
  profileId: string;
  invitedEmail?: string;
  invitedPhone?: string;
  invitedByUserId: string;
  role: UserRole;
  message?: string;
  expiresAt: Date;
  isAccepted: boolean;
  acceptedAt?: Date;
  acceptedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
  invitedBy?: User;
  acceptedBy?: User;
}

export interface CustomerProfile {
  id: string;
  profileId: string;
  preferences?: Record<string, any>;
  billingAddress?: Record<string, any>;
  paymentMethods?: Record<string, any>;
  serviceHistory?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
}

export interface ArtisanProfile {
  id: string;
  profileId: string;
  skills: string[];
  experience: number;
  portfolio: string[];
  bio?: string;
  photoUrl?: string;
  idDocumentUrl?: string;
  isOnline: boolean;
  locationTracking: boolean;
  latitude?: number;
  longitude?: number;
  lastSeen?: Date;
  hourlyRate?: number;
  availability?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  profile?: Profile;
  categories?: ArtisanProfileServiceCategory[];
}

export interface ArtisanProfileServiceCategory {
  artisanProfileId: string;
  categoryId: string;
  createdAt: Date;
  artisanProfile?: ArtisanProfile;
  category?: ServiceCategory;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  dateOfBirth?: Date;
  role: UserRole;
  authProvider: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileComplete: boolean;
  googleId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request interfaces
export interface CreateProfileRequest {
  name: string;
  type: ProfileType;
  description?: string;
  avatar?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateProfileRequest {
  name?: string;
  description?: string;
  avatar?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SwitchProfileRequest {
  profileId: string;
  identifier: string; // email or phone for authentication
}

export interface ProfileAuthenticationRequest {
  profileId: string;
  identifier: string;
  otp: string;
}

export interface InviteToProfileRequest {
  profileId: string;
  invitedEmail?: string;
  invitedPhone?: string;
  role: UserRole;
  message?: string;
}

export interface AcceptInvitationRequest {
  invitationId: string;
  userId: string;
}

export interface CustomerProfileRequest {
  preferences?: Record<string, any>;
  billingAddress?: Record<string, any>;
  paymentMethods?: Record<string, any>;
}

export interface ArtisanProfileRequest {
  skills: string[];
  experience: number;
  portfolio?: string[];
  bio?: string;
  photoUrl?: string;
  idDocumentUrl?: string;
  hourlyRate?: number;
  availability?: Record<string, any>;
}

// Response interfaces
export interface ProfileResponse {
  message: string;
  profile?: Profile;
  profiles?: Profile[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ProfileSessionResponse {
  message: string;
  session?: ProfileSession;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface ProfileInvitationResponse {
  message: string;
  invitation?: ProfileInvitation;
  invitations?: ProfileInvitation[];
}

export interface ProfileSwitchResponse {
  message: string;
  requiresAuthentication: boolean;
  profile?: Profile;
  session?: ProfileSessionResponse;
}

// Token payload for profile sessions
export interface ProfileTokenPayload {
  id: string;
  profileId: string;
  userId: string;
  role: UserRole;
  profileType: ProfileType;
  permissions?: Record<string, any>;
  iat?: number;
  exp?: number;
}

// Cache interfaces
export interface ProfileCache {
  profileId: string;
  userId: string;
  profile: Profile;
  lastAccessed: Date;
  expiresAt: Date;
}

export interface ProfileSessionCache {
  sessionId: string;
  profileId: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  lastActivityAt: Date;
}

// Error interfaces
export interface ProfileError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Validation interfaces
export interface ProfileValidationError {
  field: string;
  message: string;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ProfileValidationError[];
}

// Event interfaces for real-time updates
export interface ProfileEvent {
  type: 'PROFILE_CREATED' | 'PROFILE_UPDATED' | 'PROFILE_DELETED' | 'PROFILE_SWITCHED' | 'MEMBER_ADDED' | 'MEMBER_REMOVED';
  profileId: string;
  userId: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// Analytics interfaces
export interface ProfileAnalytics {
  profileId: string;
  totalSessions: number;
  activeSessions: number;
  lastActivity: Date;
  memberCount: number;
  switchCount: number;
  averageSessionDuration: number;
}

// Security interfaces
export interface ProfileSecuritySettings {
  requireReauthentication: boolean;
  sessionTimeout: number; // in minutes
  maxConcurrentSessions: number;
  allowedIPs?: string[];
  require2FA: boolean;
  auditLogging: boolean;
}

// Notification interfaces
export interface ProfileNotification {
  id: string;
  profileId: string;
  userId: string;
  type: 'INVITATION' | 'MEMBER_JOINED' | 'PROFILE_UPDATED' | 'SECURITY_ALERT';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
} 