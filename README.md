# Handyman Backend API

A comprehensive backend service for a handyman platform that connects users with skilled artisans. This RESTful API handles user and artisan authentication, profile management, service categories, and location-based artisan discovery.

## 🚀 Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (User, Artisan, Admin)
- Secure password hashing with bcrypt

### User Management
- User registration and authentication
- Profile management
- Secure password reset flow

### Artisan Management
- Artisan registration with verification
- Detailed artisan profiles
- Service category management
- Online status and location tracking
- Experience and bio information

### Service Management
- Service category CRUD operations
- Artisan-service category associations
- Search and filter artisans by service category

### Location Services
- Real-time artisan location tracking
- Distance-based artisan discovery
- Last seen status

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: express-validator
- **Testing**: Jest
- **Containerization**: Docker (optional)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd handyman-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="postgresql://handyman_user:handyman_password@localhost:5432/handyman_db?schema=public"
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=8000
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

7. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### User Authentication
- POST `/api/auth/user/signup` - Register a new user
- POST `/api/auth/user/login` - User login

#### Artisan Authentication
- POST `/api/auth/artisan/signup` - Register a new artisan
- POST `/api/auth/artisan/login` - Artisan login

### User Profile
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile

### Artisan Profile
- GET `/api/artisans/profile` - Get artisan profile
- PUT `/api/artisans/profile` - Update artisan profile
- PUT `/api/artisans/categories` - Update artisan service categories

### Service Categories
- GET `/api/service-categories` - Get all service categories
- POST `/api/service-categories` - Create a new service category (admin only)
- PUT `/api/service-categories/:id` - Update a service category (admin only)
- DELETE `/api/service-categories/:id` - Delete a service category (admin only)

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## 🗃️ Database Design

The database is designed with the following core entities and relationships:

### Core Models

#### 1. User
- Represents both regular users and administrators
- Handles authentication and basic user information
- Has a one-to-one relationship with Profile

#### 2. Artisan
- Extends user functionality with artisan-specific fields
- Stores professional information (experience, bio, verification status)
- Tracks online status and location
- Has a many-to-many relationship with ServiceCategory

#### 3. Profile
- Stores extended user/artisan information
- Handles address and contact details
- Linked to either a User or Artisan

#### 4. ServiceCategory
- Defines different service types (e.g., Plumbing, Electrical)
- Has a many-to-many relationship with Artisan

#### 5. ArtisanServiceCategory (Junction Table)
- Manages the many-to-many relationship between Artisan and ServiceCategory
- Tracks when categories were added to artisans

### Key Relationships
- One-to-One: User ↔ Profile
- One-to-One: Artisan ↔ Profile
- Many-to-Many: Artisan ↔ ServiceCategory (through ArtisanServiceCategory)

### Security Features
- Password hashing
- JWT token authentication
- Role-based access control
- Input validation
- Secure file upload handling

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation using express-validator
- CORS enabled
- Environment variables for sensitive data

## Error Handling

The API uses a consistent error response format:
```json
{
  "error": {
    "message": "Error message",
    "status": 400
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
