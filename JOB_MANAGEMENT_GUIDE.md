# Job Management System Guide

This guide covers the comprehensive job management system for the HandyMan platform, including service request flow, smart artisan matching engine, and cost estimation features.

## 📋 Overview

The job management system enables customers to create service requests, automatically matches them with qualified artisans using a sophisticated scoring algorithm, and provides cost estimates. The system includes push notifications via Firebase Cloud Messaging and comprehensive analytics for optimization.

## 🚀 Key Features

### Service Request Flow
- **Job Creation**: Customers can create detailed service requests with photos, location, and preferred timing
- **Smart Matching**: Advanced algorithm matches jobs with the best available artisans
- **Real-time Notifications**: Instant push notifications to selected artisans
- **Status Tracking**: Complete job lifecycle management from creation to completion

### Smart Artisan Matching Engine
- **Multi-factor Scoring**: Combines distance, rating, specialization level, and online status
- **Geolocation-based**: Uses Haversine formula for accurate distance calculations
- **Service Radius**: Respects artisan's service area preferences
- **Performance Optimization**: Efficient database queries with bounding box calculations

### Cost Estimation System
- **AI-Ready Framework**: Placeholder estimates with structure for future AI integration
- **Service-based Pricing**: Different base estimates for various service types
- **Photo Analysis Ready**: Framework supports photo-based pricing models
- **Confidence Scoring**: Provides confidence levels for estimates

## 🗃️ Database Schema

### New Tables

#### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  preferred_time TIMESTAMP,
  status job_status DEFAULT 'PENDING',
  estimated_cost FLOAT,
  actual_cost FLOAT,
  assigned_artisan_id UUID REFERENCES artisans(id) ON DELETE SET NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Job Matching Logs Table
```sql
CREATE TABLE job_matching_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  match_score FLOAT NOT NULL,
  distance_km FLOAT NOT NULL,
  rating FLOAT NOT NULL,
  specialization_level INTEGER NOT NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Enhanced Artisan Services Table
```sql
CREATE TABLE artisan_service_categories (
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  specialization_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (artisan_id, category_id)
);
```

### Updated Artisan Table
```sql
ALTER TABLE artisans ADD COLUMN average_rating FLOAT DEFAULT 0.0;
ALTER TABLE artisans ADD COLUMN service_radius_km FLOAT DEFAULT 10.0;
```

## 🔧 API Endpoints

### Job Management

#### Create Job Request
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "uuid",
  "description": "Need plumbing repair for leaking faucet",
  "photoUrls": ["https://example.com/photo1.jpg"],
  "latitude": 6.5244,
  "longitude": 3.3792,
  "preferredTime": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "jobId": "uuid",
    "job": {
      "id": "uuid",
      "serviceId": "uuid",
      "description": "Need plumbing repair for leaking faucet",
      "photoUrls": ["https://example.com/photo1.jpg"],
      "latitude": 6.5244,
      "longitude": 3.3792,
      "status": "PENDING",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  }
}
```

#### Get User Jobs
```http
GET /api/jobs/my-jobs
Authorization: Bearer <token>
```

#### Get Job Details
```http
GET /api/jobs/:jobId
Authorization: Bearer <token>
```

#### Update Job Status
```http
PUT /api/jobs/:jobId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ASSIGNED"
}
```

### Smart Matching

#### Get Matching Artisans
```http
GET /api/jobs/:jobId/matches?limit=5
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Matching artisans retrieved successfully",
  "data": {
    "matches": [
      {
        "artisanId": "uuid",
        "artisanName": "John Doe",
        "artisanPhotoUrl": "https://example.com/photo.jpg",
        "matchScore": 15.5,
        "distanceKm": 2.3,
        "rating": 4.5,
        "specializationLevel": 4,
        "isOnline": true,
        "serviceRadiusKm": 10.0
      }
    ]
  }
}
```

### Cost Estimation

#### Get Cost Estimate
```http
GET /api/estimate?serviceId=uuid
Content-Type: application/json

{
  "description": "Plumbing repair needed",
  "photoUrls": ["https://example.com/photo1.jpg"],
  "latitude": 6.5244,
  "longitude": 3.3792
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cost estimate generated successfully",
  "data": {
    "estimate": {
      "serviceId": "uuid",
      "serviceName": "Plumbing",
      "estimatedRange": {
        "min": 5000,
        "max": 25000,
        "currency": "NGN"
      },
      "confidence": 0.85,
      "factors": [
        "Service type complexity",
        "Market rates",
        "Location factors",
        "Job description analysis",
        "Photo-based assessment"
      ],
      "estimatedDuration": {
        "min": 1,
        "max": 4
      }
    }
  }
}
```

### Admin Endpoints

#### Get All Jobs
```http
GET /api/jobs?status=PENDING&limit=50&offset=0
Authorization: Bearer <admin-token>
```

#### Assign Artisan to Job
```http
POST /api/jobs/:jobId/assign
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "artisanId": "uuid"
}
```

#### Get Matching Analytics
```http
GET /api/jobs/analytics/matching?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <admin-token>
```

#### Get Job Matching Logs
```http
GET /api/jobs/:jobId/logs
Authorization: Bearer <admin-token>
```

## 🧮 Matching Algorithm

### Match Score Calculation

The smart matching engine uses a sophisticated scoring algorithm:

```typescript
matchScore = distanceScore + ratingScore + specializationScore + onlineBonus
```

Where:
- **Distance Score**: `Math.max(0, 5 - distanceKm)` - Closer artisans get higher scores
- **Rating Score**: `rating * 2` - Higher ratings contribute more to the score
- **Specialization Score**: `specializationLevel` - Direct contribution from expertise level
- **Online Bonus**: `2` if online, `0` if offline

### Example Calculation

For an artisan with:
- Distance: 3.2 km
- Rating: 4.5
- Specialization Level: 4
- Online Status: true

```
distanceScore = Math.max(0, 5 - 3.2) = 1.8
ratingScore = 4.5 * 2 = 9.0
specializationScore = 4
onlineBonus = 2

Total Match Score = 1.8 + 9.0 + 4 + 2 = 16.8
```

### Filtering Criteria

1. **Online Status**: Only online artisans are considered
2. **Service Match**: Artisan must provide the requested service
3. **Location**: Artisan must be within their service radius
4. **Coordinates**: Artisan must have valid location data

## 📱 Push Notifications

### Firebase Integration

The system uses Firebase Cloud Messaging for real-time notifications:

- **Job Notifications**: Sent to top 3-5 matching artisans
- **Cost Estimates**: Sent to customers upon request
- **Status Updates**: Notifications for job status changes

### Notification Payload

```json
{
  "title": "New Plumbing Job Available",
  "body": "Need plumbing repair for leaking faucet • 2.3km away",
  "data": {
    "jobId": "uuid",
    "serviceName": "Plumbing",
    "distanceKm": "2.3",
    "estimatedCost": "15000",
    "type": "new_job"
  }
}
```

## 📊 Analytics & Monitoring

### Matching Analytics

The system tracks comprehensive analytics for optimization:

- **Total Matches**: Number of artisans considered for each job
- **Selection Rate**: Percentage of artisans selected for notifications
- **Average Match Score**: Overall matching quality
- **Average Distance**: Typical travel distances
- **Average Rating**: Quality of matched artisans

### Performance Metrics

- **Response Time**: Time from job creation to notification
- **Acceptance Rate**: Percentage of jobs accepted by artisans
- **Completion Rate**: Percentage of assigned jobs completed
- **Customer Satisfaction**: Ratings and feedback

## 🔒 Security & Validation

### Input Validation

- **Coordinates**: Valid latitude (-90 to 90) and longitude (-180 to 180)
- **Service ID**: Valid UUID format
- **Description**: Length limits (10-1000 characters)
- **Photo URLs**: Valid URL format
- **Preferred Time**: Valid ISO 8601 format

### Access Control

- **Job Creation**: Only authenticated customers
- **Job Access**: Job owner or admin only
- **Matching Data**: Job owner or admin only
- **Analytics**: Admin only
- **Artisan Assignment**: Admin only

## 🧪 Testing

### Unit Tests

Comprehensive test coverage includes:

- Job creation and validation
- Matching algorithm accuracy
- Cost estimation logic
- Notification service
- Geolocation calculations

### Integration Tests

- End-to-end job workflow
- API endpoint validation
- Database operations
- Error handling

### Performance Tests

- Matching algorithm performance
- Database query optimization
- Notification delivery speed

## 🚀 Future Enhancements

### AI Integration

- **Photo Analysis**: Extract job details from uploaded photos
- **Smart Pricing**: ML-based cost estimation
- **Demand Prediction**: Predict service demand patterns
- **Quality Matching**: Learn from successful matches

### Advanced Features

- **Scheduling**: Advanced scheduling with calendar integration
- **Payment Integration**: In-app payment processing
- **Reviews & Ratings**: Customer feedback system
- **Dispute Resolution**: Conflict management system
- **Insurance**: Artisan insurance verification

### Performance Optimizations

- **Caching**: Redis-based caching for frequent queries
- **Background Jobs**: Queue-based notification processing
- **Database Indexing**: Optimized indexes for location queries
- **CDN Integration**: Fast photo delivery

## 📚 Related Documentation

- **[Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md)** - Complete Firebase configuration
- **[Profile Switching Guide](PROFILE_SWITCHING_GUIDE.md)** - Multi-profile management
- **[Authentication Refactor](AUTHENTICATION_REFACTOR.md)** - Auth system architecture

## 🛠️ Development

### Environment Variables

```env
# Firebase Configuration (see Firebase Setup Guide)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/handyman_db"

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Running Tests

```bash
# Run all tests
npm test

# Run job-specific tests
npm test -- --testNamePattern="Job Management"

# Run with coverage
npm run test:coverage
```

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_job_management

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## 📞 Support

For technical support or questions about the job management system:

1. Check the [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md) for notification configuration
2. Review the [API documentation](#api-endpoints) for endpoint details
3. Run the test suite to verify your setup
4. Check the console logs for debugging information 