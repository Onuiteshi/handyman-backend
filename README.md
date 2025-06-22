# Handyman Backend API

A comprehensive backend service for a handyman platform that connects customers with skilled artisans. This RESTful API handles user and artisan authentication, profile management, service categories, and location-based artisan discovery.

## 🚀 Key Features

### Authentication & Authorization
- **OTP-based authentication** for Customers and Artisans (email/phone)
- **Google OAuth integration** for seamless social login
- **Password-based authentication** for Admin users only
- JWT-based session management with refresh tokens
- Role-based access control (Customer, Artisan, Admin)

### User Management
- Unified User table with role-based profiles
- Customer and Artisan profile management
- OTP verification for email and phone
- Secure token management with logout functionality

### Artisan Management
- Artisan registration with OTP verification
- Detailed artisan profiles with skills and portfolio
- Service category management
- Online status and location tracking
- Experience and bio information

### Service Management
- Service category CRUD operations (Admin only)
- Artisan-service category associations
- Search and filter artisans by service category

### Location Services
- Real-time artisan location tracking
- Distance-based artisan discovery
- Last seen status

## 🛠️ Technology Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with OTP
- **Validation**: express-validator
- **Testing**: Jest
- **Containerization**: Docker (optional)

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

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

The database is designed with a unified authentication system and role-based profiles:

### Core Models

#### 1. User (Unified Authentication)
- Central authentication table for all user types
- Handles email/phone verification and OTP management
- Supports multiple authentication providers (EMAIL, PHONE, GOOGLE)
- Role-based access control (CUSTOMER, ARTISAN, ADMIN)
- JWT token management with refresh tokens

#### 2. Customer
- Extends user functionality for regular customers
- Stores customer-specific preferences and settings
- One-to-one relationship with User

#### 3. Artisan
- Extends user functionality with artisan-specific fields
- Stores professional information (experience, bio, skills, portfolio)
- Tracks online status, location, and verification status
- Has a many-to-many relationship with ServiceCategory
- One-to-one relationship with User

#### 4. ServiceCategory
- Defines different service types (e.g., Plumbing, Electrical, Carpentry)
- Has a many-to-many relationship with Artisan
- Managed by admin users only

#### 5. ArtisanServiceCategory (Junction Table)
- Manages the many-to-many relationship between Artisan and ServiceCategory
- Tracks when categories were added to artisans

#### 6. OTP
- Manages OTP generation, storage, and verification
- Supports different OTP types (SIGNUP, LOGIN, VERIFICATION)
- Includes expiration and usage tracking

### Key Relationships
- One-to-One: User ↔ Customer
- One-to-One: User ↔ Artisan
- Many-to-Many: Artisan ↔ ServiceCategory (through ArtisanServiceCategory)
- One-to-Many: User ↔ OTP

### Authentication Flow

#### OTP-based Authentication
1. **Signup**: User provides identifier (email/phone) → OTP sent → User verifies OTP → Account created
2. **Login**: User provides identifier → OTP sent → User verifies OTP → JWT tokens issued
3. **Admin Login**: Admin provides email/password → JWT tokens issued

#### OAuth Authentication
1. **Google OAuth**: User provides Google token → Account created/authenticated → JWT tokens issued

## Security Features

- **OTP-based authentication** for customers and artisans (6-digit codes)
- **Password-based authentication** for admin users only (hashed with bcrypt)
- **Google OAuth integration** for social login
- JWT tokens for session management with refresh token support
- Input validation using express-validator
- Role-based access control (RBAC)
- CORS enabled
- Environment variables for sensitive data
- Token expiration and validation
- Secure HTTP headers
- OTP expiration and rate limiting

## Error Handling

The API uses a consistent error response format:
```json
{
  "error": {
    "message": "Error message",
    "status": 400,
    "details": []
  }
}
```

## Testing

The project includes comprehensive test coverage:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Authentication flow testing
- Database operation testing

Run tests with:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
