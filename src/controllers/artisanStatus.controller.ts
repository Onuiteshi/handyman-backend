import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    type: 'user' | 'artisan' | 'admin';
    role?: 'USER' | 'ARTISAN' | 'ADMIN';
  };
}

/**
 * Toggle artisan's online status
 */
export const updateOnlineStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isOnline } = req.body;
    
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOnline must be a boolean value'
      });
    }
    
    const artisan = await prisma.artisan.update({
      where: { id: req.user.id },
      data: { 
        isOnline,
        lastSeen: isOnline ? new Date() : undefined
      },
      select: {
        id: true,
        isOnline: true,
        lastSeen: true
      }
    });

    res.json({
      success: true,
      data: artisan
    });
  } catch (error: any) {
    console.error('Error updating online status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update online status',
      error: error?.message || 'An unknown error occurred'
    });
  }
};

/**
 * Update location tracking consent and initial location
 */
export const updateLocationConsent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { locationTracking, latitude, longitude } = req.body;
    
    if (typeof locationTracking !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'locationTracking must be a boolean value'
      });
    }
    
    if (locationTracking && (typeof latitude !== 'number' || typeof longitude !== 'number')) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required when enabling location tracking'
      });
    }

    const updateData: any = { 
      locationTracking,
      // Only update coordinates if tracking is being enabled
      ...(locationTracking ? { 
        latitude,
        longitude,
        lastSeen: new Date()
      } : {
        latitude: null,
        longitude: null
      })
    };

    const artisan = await prisma.artisan.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        locationTracking: true,
        latitude: true,
        longitude: true,
        lastSeen: true
      }
    });

    res.json({
      success: true,
      data: {
        locationTracking: artisan.locationTracking,
        ...(artisan.latitude && artisan.longitude ? {
          location: {
            latitude: artisan.latitude,
            longitude: artisan.longitude,
            lastUpdated: artisan.lastSeen
          }
        } : {})
      }
    });
  } catch (error: any) {
    console.error('Error updating location consent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location settings',
      error: error?.message || 'An unknown error occurred'
    });
  }
};

/**
 * Update artisan's current location
 */
export const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required and must be numbers'
      });
    }
    
    // Validate latitude and longitude ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values'
      });
    }
    
    const now = new Date();
    
    const artisan = await prisma.artisan.update({
      where: { 
        id: req.user.id,
        locationTracking: true // Only update if location tracking is enabled
      },
      data: {
        latitude,
        longitude,
        lastSeen: now,
        isOnline: true // Automatically mark as online when updating location
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        lastSeen: true
      }
    });

    if (!artisan) {
      return res.status(403).json({
        success: false,
        message: 'Location tracking is not enabled for this artisan'
      });
    }

    res.json({
      success: true,
      data: {
        location: {
          latitude: artisan.latitude,
          longitude: artisan.longitude,
          lastUpdated: artisan.lastSeen
        }
      }
    });
  } catch (error: any) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error?.message || 'An unknown error occurred'
    });
  }
};

/**
 * Get artisan's current status and location
 */
export const getStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const artisan = await prisma.artisan.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        isOnline: true,
        locationTracking: true,
        latitude: true,
        longitude: true,
        lastSeen: true
      }
    });

    if (!artisan) {
      return res.status(404).json({
        success: false,
        message: 'Artisan not found'
      });
    }

    res.json({
      success: true,
      data: {
        isOnline: artisan.isOnline,
        locationTracking: artisan.locationTracking,
        ...(artisan.latitude && artisan.longitude ? {
          location: {
            latitude: artisan.latitude,
            longitude: artisan.longitude,
            lastUpdated: artisan.lastSeen
          }
        } : {})
      }
    });
  } catch (error: any) {
    console.error('Error getting artisan status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get artisan status',
      error: error?.message || 'An unknown error occurred'
    });
  }
};
