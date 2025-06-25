import { Router, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authMiddleware, isCustomer, isArtisan, isAdmin } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import jobService from '../services/job.service';
import { JobStatus } from '../types/job.types';

const router = Router();

// Validation middleware
const validateCreateJob = [
  body('serviceId').isUUID().withMessage('Invalid service ID format'),
  body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('photoUrls').isArray().withMessage('Photo URLs must be an array'),
  body('photoUrls.*').isURL().withMessage('Invalid photo URL format'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('preferredTime').optional().isISO8601().withMessage('Invalid preferred time format'),
];

const validateCostEstimate = [
  query('serviceId').isUUID().withMessage('Invalid service ID format'),
  body('description').optional().isLength({ min: 5, max: 500 }).withMessage('Description must be between 5 and 500 characters'),
  body('photoUrls').optional().isArray().withMessage('Photo URLs must be an array'),
  body('photoUrls.*').optional().isURL().withMessage('Invalid photo URL format'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

const validateJobStatus = [
  body('status').isIn(Object.values(JobStatus)).withMessage('Invalid job status'),
];

const validateAssignArtisan = [
  body('artisanId').isUUID().withMessage('Invalid artisan ID format'),
];

// Validation error handler
const handleValidationErrors = (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
    return;
  }
  next();
};

// POST /api/jobs - Create a new job request
router.post('/', [
  authMiddleware, 
  isCustomer, 
  ...validateCreateJob, 
  handleValidationErrors
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
      return;
    }

    const jobData = {
      serviceId: req.body.serviceId,
      description: req.body.description,
      photoUrls: req.body.photoUrls,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      preferredTime: req.body.preferredTime,
    };

    const job = await jobService.createJob(userId, jobData);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: {
        jobId: job.id,
        job
      }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/jobs - Get all jobs (admin endpoint)
router.get('/', [
  authMiddleware, 
  isAdmin
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status as JobStatus,
      serviceId: req.query.serviceId as string,
      userId: req.query.userId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await jobService.getAllJobs(filters);

    res.json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: result
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/jobs/my-jobs - Get current user's jobs
router.get('/my-jobs', [
  authMiddleware
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
      return;
    }

    const jobs = await jobService.getUserJobs(userId);

    res.json({
      success: true,
      message: 'User jobs retrieved successfully',
      data: { jobs }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/jobs/:jobId - Get specific job
router.get('/:jobId', [
  authMiddleware
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
      return;
    }

    const job = await jobService.getJobById(jobId);

    // Check if user has access to this job
    if (job.userId !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
      return;
    }

    res.json({
      success: true,
      message: 'Job retrieved successfully',
      data: { job }
    });
  } catch (error: any) {
    next(error);
  }
});

// PUT /api/jobs/:jobId/status - Update job status
router.put('/:jobId/status', [
  authMiddleware,
  ...validateJobStatus,
  handleValidationErrors
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
      return;
    }

    const job = await jobService.updateJobStatus(jobId, status);

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: { job }
    });
  } catch (error: any) {
    next(error);
  }
});

// POST /api/jobs/:jobId/assign - Assign artisan to job
router.post('/:jobId/assign', [
  authMiddleware,
  isAdmin,
  ...validateAssignArtisan,
  handleValidationErrors
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const { artisanId } = req.body;

    const job = await jobService.assignArtisanToJob(jobId, artisanId);

    res.json({
      success: true,
      message: 'Artisan assigned to job successfully',
      data: { job }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/jobs/:jobId/matches - Get matching artisans for a job
router.get('/:jobId/matches', [
  authMiddleware
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
      return;
    }

    // Verify user has access to this job
    const job = await jobService.getJobById(jobId);
    if (job.userId !== userId && req.user?.role !== 'ADMIN') {
      res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const matches = await jobService.matchArtisansForJob(jobId, limit);

    res.json({
      success: true,
      message: 'Matching artisans retrieved successfully',
      data: { matches }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/estimate - Get cost estimate for a service
router.get('/estimate', [
  ...validateCostEstimate,
  handleValidationErrors
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = {
      serviceId: req.query.serviceId as string,
      description: req.body.description,
      photoUrls: req.body.photoUrls,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
    };

    const estimate = await jobService.getCostEstimate(request);

    res.json({
      success: true,
      message: 'Cost estimate generated successfully',
      data: { estimate }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/jobs/:jobId/logs - Get matching logs for a job (admin only)
router.get('/:jobId/logs', [
  authMiddleware,
  isAdmin
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    const logs = await prisma.jobMatchingLog.findMany({
      where: { jobId },
      include: {
        artisan: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          }
        }
      },
      orderBy: { matchScore: 'desc' }
    });

    res.json({
      success: true,
      message: 'Matching logs retrieved successfully',
      data: { logs }
    });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/jobs/analytics/matching - Get matching analytics (admin only)
router.get('/analytics/matching', [
  authMiddleware,
  isAdmin
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, serviceId } = req.query;

    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (serviceId) {
      where.job = {
        serviceId: serviceId as string
      };
    }

    const [totalLogs, selectedLogs, avgMatchScore] = await Promise.all([
      prisma.jobMatchingLog.count({ where }),
      prisma.jobMatchingLog.count({ where: { ...where, isSelected: true } }),
      prisma.jobMatchingLog.aggregate({
        where,
        _avg: {
          matchScore: true,
          distanceKm: true,
          rating: true,
        }
      })
    ]);

    const analytics = {
      totalMatches: totalLogs,
      selectedMatches: selectedLogs,
      selectionRate: totalLogs > 0 ? (selectedLogs / totalLogs) * 100 : 0,
      averageMatchScore: avgMatchScore._avg.matchScore || 0,
      averageDistance: avgMatchScore._avg.distanceKm || 0,
      averageRating: avgMatchScore._avg.rating || 0,
    };

    res.json({
      success: true,
      message: 'Matching analytics retrieved successfully',
      data: { analytics }
    });
  } catch (error: any) {
    next(error);
  }
});

export default router; 