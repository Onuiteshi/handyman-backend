# Handyman Backend API

A backend API for a handyman service platform that connects users with artisans.

## Features

- User Authentication (Sign-up, Login)
- Artisan Authentication (Sign-up, Login)
- User Profile Management
- Artisan Profile Management
- Service Categories Management
- JWT-based Authentication
- PostgreSQL Database with Prisma ORM

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
DATABASE_URL="prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/handyman_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
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

## Database Schema

The application uses the following main tables:
- users
- artisans
- profiles
- service_categories
- artisan_service_categories

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
