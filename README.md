# Handyman Backend API

A comprehensive backend service for a handyman platform that connects customers with skilled artisans. This RESTful API handles user and artisan authentication, profile management, service categories, location-based artisan discovery, and advanced job management with smart matching.

## 📚 Documentation

- **[Job Management Guide](JOB_MANAGEMENT_GUIDE.md)** - Comprehensive guide for service request flow, smart artisan matching, and cost estimation
- **[Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md)** - Complete Firebase Cloud Messaging configuration for push notifications
- **[Profile Switching Guide](PROFILE_SWITCHING_GUIDE.md)** - Comprehensive guide for the multi-profile switching feature
- **[Authentication Refactor](AUTHENTICATION_REFACTOR.md)** - Detailed documentation of the authentication system architecture

## 🚀 Key Features

### Authentication & Authorization
- **OTP-based authentication** for Customers and Artisans (email/phone)
- **Google OAuth integration** for seamless social login
- **Password-based authentication** for Admin users only
- JWT-based session management with refresh tokens
- Role-based access control (Customer, Artisan, Admin)
- **Multi-profile switching** with separate authentication per profile

### User Management
- Unified User table with role-based profiles
- Customer and Artisan profile management
- OTP verification for email and phone
- Secure token management with logout functionality
- **Profile switching** - Users can manage multiple profiles (personal, business, freelance, corporate)

### Artisan Management
- Artisan registration with OTP verification
- Detailed artisan profiles with skills and portfolio
- Service category management with specialization levels
- Online status and location tracking
- Experience, bio, and rating information
- Service radius configuration

### Service Management
- Service category CRUD operations (Admin only)
- Artisan-service category associations with specialization levels
- Search and filter artisans by service category

### Job Management System
- **Service Request Flow**: Complete job creation and management
- **Smart Artisan Matching**: Advanced algorithm combining distance, rating, and specialization
- **Cost Estimation**: AI-ready framework for service pricing
- **Push Notifications**: Real-time notifications via Firebase Cloud Messaging
- **Analytics & Monitoring**: Comprehensive matching and performance analytics

### Location Services
- Real-time artisan location tracking
- Distance-based artisan discovery using Haversine formula
- Last seen status and service radius management

## 🛠️ Technology Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with OTP
- **Validation**: express-validator
- **Testing**: Jest
- **Push Notifications**: Firebase Cloud Messaging
- **Geolocation**: Haversine formula for distance calculations
- **Containerization**: Docker (optional)

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- Firebase project (for push notifications)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Onuiteshi/handyman-backend.git
cd handyman-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="postgresql://handyman_user:handyman_password@localhost:5432/handyman_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
PORT=8000
NODE_ENV=development

# Firebase Configuration (see Firebase Setup Guide)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
```

4. Create the database:
```bash
createdb handyman_db
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Generate Prisma client:
```bash
npx prisma generate
```

7. Seed the database (optional):
```bash
npm run seed
```

8. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### Unified Authentication (OTP-based)
- POST `/api/auth/signup` - Initiate signup process (sends OTP)
- POST `/api/auth/verify-signup` - Verify OTP and complete signup
- POST `/api/auth/login` - Initiate login process (sends OTP)
- POST `/api/auth/verify-login` - Verify OTP and complete login
- POST `/api/auth/google` - Google OAuth authentication
- POST `/api/auth/admin/login` - Admin login (password-based only)
- POST `/api/auth/refresh` - Refresh access token
- POST `/api/auth/logout` - Logout and invalidate token

### Job Management
- POST `/api/jobs` - Create a new job request
- GET `/api/jobs/my-jobs` - Get current user's jobs
- GET `/api/jobs/:jobId` - Get specific job details
- PUT `/api/jobs/:jobId/status` - Update job status
- GET `/api/jobs/:jobId/matches` - Get matching artisans for a job
- GET `/api/estimate` - Get cost estimate for a service
- GET `/api/jobs` - Get all jobs (admin only)
- POST `/api/jobs/:jobId/assign` - Assign artisan to job (admin only)
- GET `/api/jobs/:jobId/logs` - Get matching logs (admin only)
- GET `/api/jobs/analytics/matching` - Get matching analytics (admin only)

### Profile Management
- POST `/api/profiles/create` - Create a new profile
- GET `/api/profiles/my-profiles` - Get user's profiles
- POST `/api/profiles/switch` - Switch to a profile
- POST `/api/profiles/authenticate` - Authenticate for profile switch
- POST `/api/profiles/refresh-session` - Refresh profile session
- PUT `/api/profiles/:profileId` - Update profile
- DELETE `/api/profiles/:profileId` - Delete profile
- POST `/api/profiles/:profileId/invite` - Invite user to profile
- POST `/api/profiles/invitations/:invitationId/accept` - Accept invitation
- GET `/api/profiles/:profileId/analytics` - Get profile analytics

### Customer Profile
- GET `/api/users/profile` - Get customer profile
- PUT `/api/users/profile` - Update customer profile
- PUT `/api/users/preferences` - Update customer preferences

### Artisan Profile
- GET `/api/artisans/profile` - Get artisan profile
- PUT `/api/artisans/profile` - Update artisan profile
- POST `/api/artisans/categories` - Add service categories to artisan
- DELETE `/api/artisans/categories` - Remove service categories from artisan

### Artisan Status & Location
- GET `/api/artisan/status` - Get artisan status and location
- PUT `/api/artisan/online-status` - Update online status
- PUT `/api/artisan/location-consent` - Update location tracking consent
- PUT `/api/artisan/location` - Update current location

### Service Categories
- GET `/api/service-categories` - Get all service categories
- GET `/api/service-categories/:id` - Get specific category
- POST `/api/service-categories` - Create category (admin only)
- PUT `/api/service-categories/:id` - Update category (admin only)
- DELETE `/api/service-categories/:id` - Delete category (admin only)

### File Uploads
- POST `/api/uploads/artisan/photo` - Upload artisan profile photo
- POST `/api/uploads/artisan/id-document` - Upload artisan ID document

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🗃️ Database Design

The database is designed with a unified authentication system, role-based profiles, and comprehensive job management:

### Core Models

#### 1. User (Unified Authentication)
- Central authentication table for all user types
- Handles email/phone verification and OTP management
- Supports multiple authentication providers (EMAIL, PHONE, GOOGLE)
- Role-based access control (CUSTOMER, ARTISAN, ADMIN)
- JWT token management with refresh tokens

#### 2. Profile (Multi-Profile System)
- Multiple profiles per user (PERSONAL, BUSINESS, FREELANCE, CORPORATE)
- Profile-specific settings and metadata
- Profile members and permissions
- Profile sessions for authentication

#### 3. Customer
- Extends user functionality for regular customers
- Stores customer-specific preferences and settings
- One-to-one relationship with User

#### 4. Artisan
- Extends user functionality with artisan-specific fields
- Stores professional information (experience, bio, skills, portfolio)
- Tracks online status, location, verification status, and ratings
- Service radius and specialization levels

#### 5. Job Management
- **Jobs**: Service requests with location, photos, and status tracking
- **JobMatchingLog**: Analytics data for matching algorithm optimization
- **ArtisanServiceCategory**: Enhanced with specialization levels (1-5)

### Job Status Flow

```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
    ↓         ↓           ↓
CANCELLED  CANCELLED   CANCELLED
    ↓
EXPIRED
```

### Smart Matching Algorithm

The system uses a sophisticated scoring algorithm:

```
Match Score = Distance Score + Rating Score + Specialization Score + Online Bonus
```

Where:
- **Distance Score**: `Math.max(0, 5 - distanceKm)`
- **Rating Score**: `rating * 2`
- **Specialization Score**: `specializationLevel`
- **Online Bonus**: `2` if online, `0` if offline

## 🔧 Configuration

### Firebase Setup

For push notifications, follow the [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md) to:

1. Create a Firebase project
2. Generate service account credentials
3. Configure environment variables
4. Set up mobile app integration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/handyman_db"

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Firebase (see Firebase Setup Guide)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server
PORT=8000
NODE_ENV=development
```

## 🧪 Testing

The project includes comprehensive tests for all features:

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testNamePattern="Job Management"
npm test -- --testNamePattern="Authentication"
npm test -- --testNamePattern="Profile"

# Run with coverage
npm run test:coverage
```

## 📊 Monitoring & Analytics

### Job Management Analytics

- **Matching Performance**: Track selection rates and match scores
- **Response Times**: Monitor notification delivery and artisan response
- **Completion Rates**: Measure job success rates
- **Customer Satisfaction**: Track ratings and feedback

### System Health

- **Database Performance**: Monitor query performance and connection health
- **API Response Times**: Track endpoint performance
- **Error Rates**: Monitor system errors and failures
- **Notification Delivery**: Track FCM success rates

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Use secure environment variables in production
2. **Database**: Use managed PostgreSQL service
3. **Firebase**: Configure production Firebase project
4. **SSL/TLS**: Enable HTTPS for all communications
5. **Rate Limiting**: Implement API rate limiting
6. **Monitoring**: Set up application monitoring and logging

### Docker Deployment

```bash
# Build image
docker build -t handyman-backend .

# Run container
docker run -p 8000:8000 --env-file .env handyman-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:

1. Check the documentation guides
2. Review the API endpoints
3. Run the test suite
4. Check the console logs for debugging

## 🔗 Related Links

- [Job Management Guide](JOB_MANAGEMENT_GUIDE.md) - Complete job system documentation
- [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md) - Push notification configuration
- [Profile Switching Guide](PROFILE_SWITCHING_GUIDE.md) - Multi-profile management
- [Authentication Refactor](AUTHENTICATION_REFACTOR.md) - Auth system details