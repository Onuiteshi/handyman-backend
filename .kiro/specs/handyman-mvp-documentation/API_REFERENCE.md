# HandyMan API Reference

## Base URL

```
Development: http://localhost:8000/api
Production: https://api.handyman.com/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Authentication Endpoints

### 1. Initiate Signup

**Endpoint:** `POST /auth/signup`

**Description:** Initiates the signup process by sending an OTP to the provided email or phone.

**Request Body:**
```json
{
  "identifier": "user@example.com",  // or "+1234567890"
  "identifierType": "email",         // or "phone"
  "role": "CUSTOMER"                 // or "ARTISAN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "identifier": "user@example.com",
    "expiresAt": "2024-01-15T10:10:00Z"
  }
}
```

### 2. Verify Signup

**Endpoint:** `POST /auth/verify-signup`

**Description:** Verifies the OTP and completes the signup process.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "otp": "123456",
  "name": "John Doe",
  "role": "CUSTOMER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "CUSTOMER",
      "profileComplete": false
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### 3. Initiate Login

**Endpoint:** `POST /auth/login`

**Description:** Initiates the login process by sending an OTP.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "identifierType": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "identifier": "user@example.com",
    "expiresAt": "2024-01-15T10:10:00Z"
  }
}
```

### 4. Verify Login

**Endpoint:** `POST /auth/verify-login`

**Description:** Verifies the OTP and completes the login process.

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### 5. Google OAuth

**Endpoint:** `POST /auth/google`

**Description:** Authenticates user via Google OAuth.

**Request Body:**
```json
{
  "idToken": "google_id_token",
  "role": "CUSTOMER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

### 6. Admin Login

**Endpoint:** `POST /auth/admin/login`

**Description:** Password-based login for admin users.

**Request Body:**
```json
{
  "email": "admin@handyman.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

### 7. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Description:** Refreshes the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

### 8. Logout

**Endpoint:** `POST /auth/logout`

**Description:** Logs out the user and invalidates tokens.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Job Endpoints

### 1. Create Job

**Endpoint:** `POST /jobs`

**Description:** Creates a new service request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
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
      "estimatedCost": 15000,
      "createdAt": "2024-01-15T09:00:00Z"
    }
  }
}
```

### 2. Get My Jobs

**Endpoint:** `GET /jobs/my-jobs`

**Description:** Retrieves all jobs for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by job status (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
- `limit` (optional): Number of results per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "serviceId": "uuid",
        "serviceName": "Plumbing",
        "description": "Need plumbing repair",
        "status": "ASSIGNED",
        "estimatedCost": 15000,
        "assignedArtisan": {
          "id": "uuid",
          "name": "John Doe",
          "photoUrl": "https://example.com/photo.jpg",
          "rating": 4.5
        },
        "createdAt": "2024-01-15T09:00:00Z"
      }
    ],
    "total": 10,
    "limit": 20,
    "offset": 0
  }
}
```

### 3. Get Job Details

**Endpoint:** `GET /jobs/:jobId`

**Description:** Retrieves detailed information about a specific job.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Job details retrieved successfully",
  "data": {
    "job": {
      "id": "uuid",
      "serviceId": "uuid",
      "serviceName": "Plumbing",
      "description": "Need plumbing repair for leaking faucet",
      "photoUrls": ["https://example.com/photo1.jpg"],
      "latitude": 6.5244,
      "longitude": 3.3792,
      "address": "123 Main St, Lagos",
      "preferredTime": "2024-01-15T10:00:00Z",
      "status": "ASSIGNED",
      "estimatedCost": 15000,
      "actualCost": null,
      "assignedArtisan": {
        "id": "uuid",
        "name": "John Doe",
        "phone": "+1234567890",
        "photoUrl": "https://example.com/photo.jpg",
        "rating": 4.5,
        "bio": "Experienced plumber with 10 years experience"
      },
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-15T09:30:00Z"
    }
  }
}
```

### 4. Update Job Status

**Endpoint:** `PUT /jobs/:jobId/status`

**Description:** Updates the status of a job (artisan only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "IN_PROGRESS"  // or "COMPLETED", "CANCELLED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job status updated successfully",
  "data": {
    "job": {
      "id": "uuid",
      "status": "IN_PROGRESS",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

### 5. Get Matching Artisans

**Endpoint:** `GET /jobs/:jobId/matches`

**Description:** Retrieves artisans matched for a specific job.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of results (default: 5)

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

### 6. Get Cost Estimate

**Endpoint:** `GET /estimate`

**Description:** Gets a cost estimate for a service request.

**Query Parameters:**
- `serviceId` (required): Service category ID

**Request Body:**
```json
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

## User Profile Endpoints

### 1. Get User Profile

**Endpoint:** `GET /users/profile`

**Description:** Retrieves the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": "+1234567890",
      "name": "John Doe",
      "role": "CUSTOMER",
      "avatar": "https://example.com/avatar.jpg",
      "address": "123 Main St, Lagos",
      "latitude": 6.5244,
      "longitude": 3.3792,
      "profileComplete": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 2. Update User Profile

**Endpoint:** `PUT /users/profile`

**Description:** Updates the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "address": "123 Main St, Lagos",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

## Artisan Profile Endpoints

### 1. Get Artisan Profile

**Endpoint:** `GET /artisans/profile`

**Description:** Retrieves the authenticated artisan's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Artisan profile retrieved successfully",
  "data": {
    "artisan": {
      "id": "uuid",
      "userId": "uuid",
      "skills": ["Plumbing", "Pipe Fitting"],
      "experience": 10,
      "portfolio": ["https://example.com/work1.jpg"],
      "bio": "Experienced plumber with 10 years experience",
      "photoUrl": "https://example.com/photo.jpg",
      "isOnline": true,
      "averageRating": 4.5,
      "serviceRadiusKm": 10.0,
      "categories": [
        {
          "id": "uuid",
          "name": "Plumbing",
          "specializationLevel": 4
        }
      ]
    }
  }
}
```

### 2. Update Artisan Profile

**Endpoint:** `PUT /artisans/profile`

**Description:** Updates the authenticated artisan's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "skills": ["Plumbing", "Pipe Fitting", "Water Heater Installation"],
  "experience": 11,
  "bio": "Experienced plumber with 11 years experience",
  "photoUrl": "https://example.com/photo.jpg",
  "serviceRadiusKm": 15.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Artisan profile updated successfully",
  "data": {
    "artisan": { ... }
  }
}
```

### 3. Add Service Categories

**Endpoint:** `POST /artisans/categories`

**Description:** Adds service categories to the artisan's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "categories": [
    {
      "categoryId": "uuid",
      "specializationLevel": 4
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service categories added successfully"
}
```

### 4. Update Online Status

**Endpoint:** `PUT /artisan/online-status`

**Description:** Updates the artisan's online/offline status.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "isOnline": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Online status updated successfully",
  "data": {
    "isOnline": true,
    "lastSeen": "2024-01-15T10:00:00Z"
  }
}
```

### 5. Update Location

**Endpoint:** `PUT /artisan/location`

**Description:** Updates the artisan's current location.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "latitude": 6.5244,
  "longitude": 3.3792
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

## Service Category Endpoints

### 1. Get All Categories

**Endpoint:** `GET /service-categories`

**Description:** Retrieves all service categories.

**Response:**
```json
{
  "success": true,
  "message": "Service categories retrieved successfully",
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Plumbing",
        "description": "Plumbing services including repairs and installations"
      },
      {
        "id": "uuid",
        "name": "Electrical",
        "description": "Electrical services and repairs"
      }
    ]
  }
}
```

### 2. Create Category (Admin)

**Endpoint:** `POST /service-categories`

**Description:** Creates a new service category (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "name": "Carpentry",
  "description": "Carpentry and woodwork services"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service category created successfully",
  "data": {
    "category": {
      "id": "uuid",
      "name": "Carpentry",
      "description": "Carpentry and woodwork services"
    }
  }
}
```

## Profile Management Endpoints

### 1. Create Profile

**Endpoint:** `POST /profiles/create`

**Description:** Creates a new profile for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Business",
  "type": "BUSINESS",
  "description": "Business profile for company services"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "profile": {
      "id": "uuid",
      "name": "My Business",
      "type": "BUSINESS",
      "status": "ACTIVE",
      "ownerId": "uuid"
    }
  }
}
```

### 2. Get My Profiles

**Endpoint:** `GET /profiles/my-profiles`

**Description:** Retrieves all profiles for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Profiles retrieved successfully",
  "data": {
    "profiles": [
      {
        "id": "uuid",
        "name": "Personal",
        "type": "PERSONAL",
        "status": "ACTIVE",
        "isOwner": true
      },
      {
        "id": "uuid",
        "name": "My Business",
        "type": "BUSINESS",
        "status": "ACTIVE",
        "isOwner": true
      }
    ]
  }
}
```

### 3. Switch Profile

**Endpoint:** `POST /profiles/switch`

**Description:** Switches to a different profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "profileId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile switched successfully",
  "data": {
    "profile": { ... },
    "tokens": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_refresh_token"
    }
  }
}
```

## File Upload Endpoints

### 1. Upload Artisan Photo

**Endpoint:** `POST /uploads/artisan/photo`

**Description:** Uploads an artisan profile photo.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `photo`: File (JPEG, PNG, WebP, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "photoUrl": "https://example.com/uploads/artisan/photo.jpg"
  }
}
```

### 2. Upload ID Document

**Endpoint:** `POST /uploads/artisan/id-document`

**Description:** Uploads an artisan ID document.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `document`: File (JPEG, PNG, PDF, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "ID document uploaded successfully",
  "data": {
    "documentUrl": "https://example.com/uploads/artisan/id-document.jpg"
  }
}
```

## Admin Endpoints

### 1. Get All Jobs (Admin)

**Endpoint:** `GET /jobs`

**Description:** Retrieves all jobs (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Results per page
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [ ... ],
    "total": 100
  }
}
```

### 2. Assign Artisan to Job (Admin)

**Endpoint:** `POST /jobs/:jobId/assign`

**Description:** Manually assigns an artisan to a job (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "artisanId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Artisan assigned successfully",
  "data": {
    "job": { ... }
  }
}
```

### 3. Get Matching Analytics (Admin)

**Endpoint:** `GET /jobs/analytics/matching`

**Description:** Retrieves matching algorithm analytics (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `startDate` (optional): Start date for analytics
- `endDate` (optional): End date for analytics

**Response:**
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "analytics": {
      "totalMatches": 1000,
      "averageMatchScore": 12.5,
      "averageDistance": 5.2,
      "selectionRate": 0.15,
      "acceptanceRate": 0.75
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP
- Admin endpoints: 1000 requests per 15 minutes per IP

## Pagination

List endpoints support pagination with `limit` and `offset` query parameters:

```
GET /jobs/my-jobs?limit=20&offset=40
```

Default limit: 20
Maximum limit: 100

## Filtering and Sorting

Some endpoints support filtering and sorting:

```
GET /jobs/my-jobs?status=COMPLETED&sortBy=createdAt&order=desc
```

## Webhooks (Future)

Future implementation will include webhooks for:
- Job status changes
- New job assignments
- Payment confirmations
- Rating submissions

## SDK and Client Libraries (Future)

Official client libraries will be provided for:
- JavaScript/TypeScript
- React Native
- iOS (Swift)
- Android (Kotlin)
