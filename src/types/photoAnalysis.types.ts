export enum JobType {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  CARPENTRY = 'CARPENTRY',
  PAINTING = 'PAINTING',
  CLEANING = 'CLEANING',
  GARDENING = 'GARDENING',
  GENERAL_MAINTENANCE = 'GENERAL_MAINTENANCE'
}

export enum DamageLevel {
  NONE = 'NONE',
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE'
}

export enum MaterialType {
  WOOD = 'WOOD',
  METAL = 'METAL',
  PLASTIC = 'PLASTIC',
  GLASS = 'GLASS',
  CERAMIC = 'CERAMIC',
  CONCRETE = 'CONCRETE',
  FABRIC = 'FABRIC',
  STONE = 'STONE'
}

export interface PhotoAnalysisResult {
  photoUrl: string;
  jobType: JobType;
  damageLevel: DamageLevel;
  materials: MaterialType[];
  complexity: number; // 1-10 scale
  estimatedDuration: {
    min: number; // hours
    max: number; // hours
  };
  confidence: number; // 0-1 scale
  detectedObjects: string[];
  detectedText: string[];
  safetyIssues: string[];
  analysisTimestamp: string;
}

export interface JobPhotoAnalysis {
  overallAnalysis: PhotoAnalysisResult;
  individualAnalyses: PhotoAnalysisResult[];
  aggregatedInsights: {
    primaryJobType: JobType;
    averageDamageLevel: DamageLevel;
    allMaterials: MaterialType[];
    totalComplexity: number;
    estimatedTotalDuration: {
      min: number;
      max: number;
    };
    confidence: number;
  };
}

export interface PhotoAnalysisRequest {
  photoUrls: string[];
  jobId?: string;
  serviceId?: string;
}

export interface PhotoAnalysisResponse {
  success: boolean;
  message: string;
  data: {
    analysis: JobPhotoAnalysis;
    costImpact: {
      baseMultiplier: number;
      complexityMultiplier: number;
      damageMultiplier: number;
      materialMultiplier: number;
      totalMultiplier: number;
    };
    recommendations: {
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      safetyNotes: string[];
      materialRequirements: string[];
      estimatedCostRange: {
        min: number;
        max: number;
        currency: string;
      };
    };
  };
} 