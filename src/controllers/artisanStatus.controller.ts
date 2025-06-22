import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

// Type for our authenticated request
type AuthenticatedRequest = AuthRequest;

/**
 * Toggle artisan's online status
 */
export const updateOnlineStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { isOnline } = req.body;

    // Find the artisan record for this user
    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      res.status(404).json({ message: 'Artisan profile not found' });
      return;
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: { 
        isOnline,
        lastSeen: isOnline ? new Date() : null
      }
    });

    res.json({
      message: 'Online status updated successfully',
      isOnline: updatedArtisan.isOnline,
      lastSeen: updatedArtisan.lastSeen
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update location tracking consent and initial location
 */
export const updateLocationConsent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { locationTracking } = req.body;

    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      res.status(404).json({ message: 'Artisan profile not found' });
      return;
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: { locationTracking }
    });

    res.json({
      message: 'Location tracking preference updated successfully',
      locationTracking: updatedArtisan.locationTracking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update artisan's current location
 */
export const updateLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { latitude, longitude } = req.body;

    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      res.status(404).json({ message: 'Artisan profile not found' });
      return;
    }

    if (!artisan.locationTracking) {
      res.status(403).json({ message: 'Location tracking is disabled' });
      return;
    }

    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: { 
        latitude,
        longitude,
        lastSeen: new Date()
      }
    });

    res.json({
      message: 'Location updated successfully',
      latitude: updatedArtisan.latitude,
      longitude: updatedArtisan.longitude,
      lastSeen: updatedArtisan.lastSeen
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get artisan's current status and location
 */
export const getStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      res.status(404).json({ message: 'Artisan profile not found' });
      return;
    }

    res.json({
      isOnline: artisan.isOnline,
      locationTracking: artisan.locationTracking,
      latitude: artisan.latitude,
      longitude: artisan.longitude,
      lastSeen: artisan.lastSeen
    });
  } catch (error) {
    next(error);
  }
};
