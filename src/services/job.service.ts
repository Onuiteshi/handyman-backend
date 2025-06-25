import prisma from '../lib/prisma';
import { 
  CreateJobRequest, 
  JobResponse, 
  JobMatchingResult, 
  CostEstimateRequest, 
  CostEstimateResponse,
  JobMatchingLog,
  MatchingCriteria,
  JobStatus
} from '../types/job.types';
import { calculateDistance, calculateMatchScore, validateCoordinates } from '../utils/geolocation';
import notificationService from './notification.service';

class JobService {
  /**
   * Create a new job request
   */
  async createJob(userId: string, jobData: CreateJobRequest): Promise<JobResponse> {
    // Validate coordinates
    if (!validateCoordinates(jobData.latitude, jobData.longitude)) {
      throw new Error('Invalid coordinates provided');
    }

    // Verify service category exists
    const service = await prisma.serviceCategory.findUnique({
      where: { id: jobData.serviceId }
    });

    if (!service) {
      throw new Error('Service category not found');
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        userId,
        serviceId: jobData.serviceId,
        description: jobData.description,
        photoUrls: jobData.photoUrls,
        latitude: jobData.latitude,
        longitude: jobData.longitude,
        preferredTime: jobData.preferredTime ? new Date(jobData.preferredTime) : null,
        status: JobStatus.PENDING,
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    // Trigger artisan matching
    await this.matchArtisansForJob(job.id);

    return this.formatJobResponse(job);
  }

  /**
   * Find matching artisans for a job
   */
  async matchArtisansForJob(jobId: string, limit: number = 5): Promise<JobMatchingResult[]> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { service: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Find online artisans who provide this service
    const matchingArtisans = await prisma.artisan.findMany({
      where: {
        isOnline: true,
        latitude: { not: null },
        longitude: { not: null },
        categories: {
          some: {
            categoryId: job.serviceId
          }
        }
      },
      include: {
        user: {
          select: {
            name: true,
          }
        },
        categories: {
          where: {
            categoryId: job.serviceId
          },
          include: {
            category: true
          }
        }
      }
    });

    // Calculate match scores and filter by distance
    const artisansWithScores: JobMatchingResult[] = [];

    for (const artisan of matchingArtisans) {
      if (!artisan.latitude || !artisan.longitude) continue;

      const distanceKm = calculateDistance(
        job.latitude,
        job.longitude,
        artisan.latitude,
        artisan.longitude
      );

      // Check if artisan is within their service radius
      if (distanceKm > artisan.serviceRadiusKm) continue;

      const specializationLevel = artisan.categories[0]?.specializationLevel || 1;
      const matchScore = calculateMatchScore(
        distanceKm,
        artisan.averageRating,
        specializationLevel,
        artisan.isOnline
      );

      artisansWithScores.push({
        artisanId: artisan.id,
        artisanName: artisan.user.name,
        artisanPhotoUrl: artisan.photoUrl || undefined,
        matchScore,
        distanceKm,
        rating: artisan.averageRating,
        specializationLevel,
        isOnline: artisan.isOnline,
        serviceRadiusKm: artisan.serviceRadiusKm,
      });
    }

    // Sort by match score and take top results
    const topArtisans = artisansWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    // Log matching results for analytics
    await this.logMatchingResults(jobId, artisansWithScores, topArtisans);

    // Send notifications to top artisans
    await this.sendJobNotifications(job, topArtisans);

    return topArtisans;
  }

  /**
   * Log matching results for analytics and learning
   */
  private async logMatchingResults(
    jobId: string,
    allArtisans: JobMatchingResult[],
    selectedArtisans: JobMatchingResult[]
  ): Promise<void> {
    const logs = allArtisans.map(artisan => ({
      jobId,
      artisanId: artisan.artisanId,
      matchScore: artisan.matchScore,
      distanceKm: artisan.distanceKm,
      rating: artisan.rating,
      specializationLevel: artisan.specializationLevel,
      isSelected: selectedArtisans.some(selected => selected.artisanId === artisan.artisanId),
      notificationSent: selectedArtisans.some(selected => selected.artisanId === artisan.artisanId),
      notificationSentAt: selectedArtisans.some(selected => selected.artisanId === artisan.artisanId) 
        ? new Date() 
        : null,
    }));

    await prisma.jobMatchingLog.createMany({
      data: logs
    });
  }

  /**
   * Send notifications to selected artisans
   */
  private async sendJobNotifications(
    job: any,
    selectedArtisans: JobMatchingResult[]
  ): Promise<void> {
    // Get FCM tokens for selected artisans (you'll need to store these in your user/artisan model)
    // For now, we'll use a placeholder approach
    const artisanTokens: string[] = []; // TODO: Get actual FCM tokens from database

    if (artisanTokens.length > 0) {
      try {
        await notificationService.sendJobNotification(artisanTokens, {
          jobId: job.id,
          serviceName: job.service.name,
          description: job.description,
          distanceKm: selectedArtisans[0]?.distanceKm || 0,
          estimatedCost: job.estimatedCost || undefined,
        });
      } catch (error) {
        console.error('Failed to send job notifications:', error);
        // Don't throw error to avoid breaking the job creation flow
      }
    }
  }

  /**
   * Get cost estimate for a service
   */
  async getCostEstimate(request: CostEstimateRequest): Promise<CostEstimateResponse> {
    // Verify service category exists
    const service = await prisma.serviceCategory.findUnique({
      where: { id: request.serviceId }
    });

    if (!service) {
      throw new Error('Service category not found');
    }

    // TODO: Implement real AI-based cost estimation
    // For now, return placeholder estimates based on service type
    const estimate = this.generatePlaceholderEstimate(service.name, request);

    return {
      serviceId: service.id,
      serviceName: service.name,
      estimatedRange: estimate.range,
      confidence: estimate.confidence,
      factors: estimate.factors,
      estimatedDuration: estimate.duration,
    };
  }

  /**
   * Generate placeholder cost estimates (replace with real AI model later)
   */
  private generatePlaceholderEstimate(
    serviceName: string,
    request: CostEstimateRequest
  ): {
    range: { min: number; max: number; currency: string };
    confidence: number;
    factors: string[];
    duration?: { min: number; max: number };
  } {
    // Base estimates by service type (in NGN)
    const baseEstimates: Record<string, { min: number; max: number; duration?: { min: number; max: number } }> = {
      'Plumbing': { min: 5000, max: 25000, duration: { min: 1, max: 4 } },
      'Electrical': { min: 8000, max: 35000, duration: { min: 2, max: 6 } },
      'Carpentry': { min: 10000, max: 50000, duration: { min: 3, max: 8 } },
      'Cleaning': { min: 3000, max: 15000, duration: { min: 2, max: 6 } },
      'Painting': { min: 15000, max: 80000, duration: { min: 4, max: 12 } },
      'Gardening': { min: 5000, max: 20000, duration: { min: 2, max: 5 } },
      'General Maintenance': { min: 8000, max: 40000, duration: { min: 2, max: 8 } },
    };

    const baseEstimate = baseEstimates[serviceName] || { min: 5000, max: 15000, duration: { min: 1, max: 4 } };

    // Add some randomness to make estimates more realistic
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const minCost = Math.round(baseEstimate.min * randomFactor);
    const maxCost = Math.round(baseEstimate.max * randomFactor);

    const factors = [
      'Service type complexity',
      'Market rates',
      'Location factors',
    ];

    if (request.description) {
      factors.push('Job description analysis');
    }

    if (request.photoUrls && request.photoUrls.length > 0) {
      factors.push('Photo-based assessment');
    }

    return {
      range: {
        min: minCost,
        max: maxCost,
        currency: 'NGN',
      },
      confidence: 0.7 + Math.random() * 0.2, // 0.7 to 0.9
      factors,
      duration: baseEstimate.duration,
    };
  }

  /**
   * Get all jobs (admin endpoint)
   */
  async getAllJobs(
    filters: {
      status?: JobStatus;
      serviceId?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ jobs: JobResponse[]; total: number }> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.userId) where.userId = filters.userId;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          service: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          },
          assignedArtisan: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.job.count({ where })
    ]);

    return {
      jobs: jobs.map((job: any) => this.formatJobResponse(job)),
      total
    };
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId: string): Promise<JobResponse> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        assignedArtisan: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.formatJobResponse(job);
  }

  /**
   * Get jobs for a specific user
   */
  async getUserJobs(userId: string): Promise<JobResponse[]> {
    const jobs = await prisma.job.findMany({
      where: { userId },
      include: {
        service: true,
        assignedArtisan: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map((job: any) => this.formatJobResponse(job));
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: JobStatus): Promise<JobResponse> {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { 
        status,
        completedAt: status === JobStatus.COMPLETED ? new Date() : null
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        assignedArtisan: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    return this.formatJobResponse(job);
  }

  /**
   * Assign artisan to job
   */
  async assignArtisanToJob(jobId: string, artisanId: string): Promise<JobResponse> {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { 
        assignedArtisanId: artisanId,
        status: JobStatus.ASSIGNED
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        assignedArtisan: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    return this.formatJobResponse(job);
  }

  /**
   * Format job response
   */
  private formatJobResponse(job: any): JobResponse {
    return {
      id: job.id,
      userId: job.userId,
      serviceId: job.serviceId,
      description: job.description,
      photoUrls: job.photoUrls,
      latitude: job.latitude,
      longitude: job.longitude,
      preferredTime: job.preferredTime?.toISOString(),
      status: job.status,
      estimatedCost: job.estimatedCost,
      actualCost: job.actualCost,
      assignedArtisanId: job.assignedArtisanId,
      completedAt: job.completedAt?.toISOString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      service: job.service ? {
        id: job.service.id,
        name: job.service.name,
        description: job.service.description,
      } : undefined,
      assignedArtisan: job.assignedArtisan ? {
        id: job.assignedArtisan.id,
        name: job.assignedArtisan.user.name,
        photoUrl: job.assignedArtisan.photoUrl || undefined,
        averageRating: job.assignedArtisan.averageRating,
      } : undefined,
    };
  }
}

export default new JobService(); 