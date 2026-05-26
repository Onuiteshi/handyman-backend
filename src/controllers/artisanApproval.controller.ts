import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import notificationService from '../services/notification.service';

/**
 * Get all pending artisan applications
 * GET /api/admin/artisans/pending
 * 
 * Requirements: 8.1
 */
export const getPendingArtisans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Fetch artisans with PENDING_VERIFICATION status
    const pendingArtisans = await prisma.artisan.findMany({
      where: {
        status: 'PENDING_VERIFICATION'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      message: 'Pending artisans retrieved successfully',
      artisans: pendingArtisans.map(artisan => ({
        id: artisan.id,
        userId: artisan.userId,
        skills: artisan.skills,
        photoUrl: artisan.photoUrl,
        idDocumentUrl: artisan.idDocumentUrl,
        createdAt: artisan.createdAt.toISOString(),
        user: artisan.user
      }))
    });
  } catch (error) {
    console.error('Error fetching pending artisans:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch pending artisans'
    });
  }
};

/**
 * Approve an artisan application
 * PUT /api/admin/artisans/:id/approve
 * 
 * Requirements: 8.2, 8.4, 8.6
 */
export const approveArtisan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if artisan exists
    const artisan = await prisma.artisan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!artisan) {
      return res.status(404).json({ 
        message: 'Artisan not found'
      });
    }

    // Update artisan status to ACTIVE (Requirement 8.4)
    const updatedArtisan = await prisma.artisan.update({
      where: { id },
      data: {
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    // Send approval notification (Requirement 8.6)
    try {
      // TODO: Get FCM token from user device registration
      // For now, we'll log the notification
      console.log(`Approval notification should be sent to artisan ${artisan.userId}`);
      
      // When FCM tokens are available, uncomment:
      // await notificationService.sendToDevice(userFcmToken, {
      //   title: 'Application Approved',
      //   body: 'Congratulations! Your artisan application has been approved. You can now start accepting jobs.',
      //   data: {
      //     type: 'ARTISAN_APPROVAL',
      //     artisanId: artisan.id
      //   }
      // });
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    return res.status(200).json({
      message: 'Artisan approved successfully',
      artisan: {
        id: updatedArtisan.id,
        userId: updatedArtisan.userId,
        status: updatedArtisan.status,
        user: updatedArtisan.user
      }
    });
  } catch (error) {
    console.error('Error approving artisan:', error);
    return res.status(500).json({ 
      message: 'Failed to approve artisan'
    });
  }
};

/**
 * Reject an artisan application
 * PUT /api/admin/artisans/:id/reject
 * 
 * Requirements: 8.3, 8.5, 8.6
 */
export const rejectArtisan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason

    // Check if artisan exists
    const artisan = await prisma.artisan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!artisan) {
      return res.status(404).json({ 
        message: 'Artisan not found'
      });
    }

    // Update artisan status to SUSPENDED (Requirement 8.5)
    const updatedArtisan = await prisma.artisan.update({
      where: { id },
      data: {
        status: 'SUSPENDED'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    // Send rejection notification (Requirement 8.6)
    try {
      // TODO: Get FCM token from user device registration
      // For now, we'll log the notification
      console.log(`Rejection notification should be sent to artisan ${artisan.userId}`);
      
      // When FCM tokens are available, uncomment:
      // await notificationService.sendToDevice(userFcmToken, {
      //   title: 'Application Status Update',
      //   body: reason 
      //     ? `Your artisan application has been reviewed. Reason: ${reason}`
      //     : 'Your artisan application has been reviewed. Please contact support for more information.',
      //   data: {
      //     type: 'ARTISAN_REJECTION',
      //     artisanId: artisan.id,
      //     reason: reason || ''
      //   }
      // });
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    return res.status(200).json({
      message: 'Artisan rejected successfully',
      artisan: {
        id: updatedArtisan.id,
        userId: updatedArtisan.userId,
        status: updatedArtisan.status,
        user: updatedArtisan.user
      }
    });
  } catch (error) {
    console.error('Error rejecting artisan:', error);
    return res.status(500).json({ 
      message: 'Failed to reject artisan'
    });
  }
};
