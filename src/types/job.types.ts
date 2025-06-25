export interface CreateJobRequest {
  serviceId: string;
  description: string;
  photoUrls: string[];
  latitude: number;
  longitude: number;
  preferredTime?: string; // ISO string
}

export interface JobResponse {
  id: string;
  userId: string;
  serviceId: string;
  description: string;
  photoUrls: string[];
  latitude: number;
  longitude: number;
  preferredTime?: string;
  status: JobStatus;
  estimatedCost?: number;
  actualCost?: number;
  assignedArtisanId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    name: string;
    description?: string;
  };
  assignedArtisan?: {
    id: string;
    name: string;
    photoUrl?: string;
    averageRating: number;
  };
}

export interface JobMatchingResult {
  artisanId: string;
  artisanName: string;
  artisanPhotoUrl?: string;
  matchScore: number;
  distanceKm: number;
  rating: number;
  specializationLevel: number;
  isOnline: boolean;
  serviceRadiusKm: number;
}

export interface CostEstimateRequest {
  serviceId: string;
  description?: string;
  photoUrls?: string[];
  latitude?: number;
  longitude?: number;
}

export interface CostEstimateResponse {
  serviceId: string;
  serviceName: string;
  estimatedRange: {
    min: number;
    max: number;
    currency: string;
  };
  confidence: number; // 0-1
  factors: string[]; // Factors considered in estimation
  estimatedDuration?: {
    min: number; // hours
    max: number; // hours
  };
}

export interface JobMatchingLog {
  id: string;
  jobId: string;
  artisanId: string;
  matchScore: number;
  distanceKm: number;
  rating: number;
  specializationLevel: number;
  isSelected: boolean;
  notificationSent: boolean;
  notificationSentAt?: string;
  createdAt: string;
}

export enum JobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  token?: string;
  topic?: string;
}

export interface ArtisanLocation {
  artisanId: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  serviceRadiusKm: number;
  lastSeen: string;
}

export interface MatchingCriteria {
  serviceId: string;
  jobLatitude: number;
  jobLongitude: number;
  maxDistanceKm?: number;
  minRating?: number;
  minSpecializationLevel?: number;
  limit?: number;
} 