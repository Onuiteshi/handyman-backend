/**
 * Geolocation utilities for calculating distances and matching artisans
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is within a specified radius of another point
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param pointLat Point latitude
 * @param pointLon Point longitude
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
}

/**
 * Calculate match score for artisan based on multiple factors
 * @param distanceKm Distance in kilometers
 * @param rating Artisan's average rating (0-5)
 * @param specializationLevel Artisan's specialization level (1-5)
 * @param isOnline Whether artisan is online
 * @returns Match score (higher is better)
 */
export function calculateMatchScore(
  distanceKm: number,
  rating: number,
  specializationLevel: number,
  isOnline: boolean = true
): number {
  // Base score starts with distance factor (closer is better)
  // Max distance penalty is 5 points, minimum is 0
  const distanceScore = Math.max(0, 5 - distanceKm);
  
  // Rating factor (0-5 rating * 2 = 0-10 points)
  const ratingScore = rating * 2;
  
  // Specialization level factor (1-5 points)
  const specializationScore = specializationLevel;
  
  // Online bonus (2 points if online)
  const onlineBonus = isOnline ? 2 : 0;
  
  // Calculate total score
  const totalScore = distanceScore + ratingScore + specializationScore + onlineBonus;
  
  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Sort artisans by match score in descending order
 */
export function sortArtisansByMatchScore<T extends { matchScore: number }>(
  artisans: T[]
): T[] {
  return [...artisans].sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Filter artisans by distance and other criteria
 */
export function filterArtisansByCriteria<T extends {
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  averageRating: number;
  isOnline: boolean;
}>(
  artisans: T[],
  jobLatitude: number,
  jobLongitude: number,
  criteria: {
    maxDistanceKm?: number;
    minRating?: number;
    minSpecializationLevel?: number;
    onlineOnly?: boolean;
  } = {}
): T[] {
  return artisans.filter(artisan => {
    // Check if artisan is within their service radius
    const distance = calculateDistance(
      jobLatitude,
      jobLongitude,
      artisan.latitude,
      artisan.longitude
    );
    
    if (distance > artisan.serviceRadiusKm) {
      return false;
    }
    
    // Check maximum distance constraint
    if (criteria.maxDistanceKm && distance > criteria.maxDistanceKm) {
      return false;
    }
    
    // Check minimum rating constraint
    if (criteria.minRating && artisan.averageRating < criteria.minRating) {
      return false;
    }
    
    // Check online status
    if (criteria.onlineOnly && !artisan.isOnline) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get bounding box coordinates for efficient database queries
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  const latDelta = radiusKm / 111.32; // Approximate km per degree latitude
  const lonDelta = radiusKm / (111.32 * Math.cos(toRadians(centerLat)));
  
  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLon: centerLon - lonDelta,
    maxLon: centerLon + lonDelta,
  };
}

/**
 * Validate coordinates
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
} 