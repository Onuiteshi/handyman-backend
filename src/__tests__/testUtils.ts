type UserType = 'user' | 'artisan' | 'admin';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  type: UserType;
  token: string;
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@test.com',
    password: 'password123',
    name: 'Test Admin',
    type: 'admin',
    token: 'test-admin-token',
  },
  artisan: {
    id: 'test-artisan-id',
    email: 'artisan@test.com',
    password: 'password123',
    name: 'Test Artisan',
    type: 'artisan',
    token: 'test-artisan-token',
  },
  user: {
    id: 'test-user-id',
    email: 'user@test.com',
    password: 'password123',
    name: 'Test User',
    type: 'user',
    token: 'test-user-token',
  },
} as const;

// Mock data
export const mockCategory = {
  id: 'test-category-id',
  name: 'Test Category',
  description: 'Test Description',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockArtisan = {
  id: 'test-artisan-id',
  email: 'artisan@test.com',
  name: 'Test Artisan',
  experience: 5,
  bio: 'Test bio',
  photoUrl: 'https://example.com/photo.jpg',
  idDocumentUrl: 'https://example.com/id.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Initialize test data
export async function setupTestData() {
  // No-op for now as we're using mocks
  return;
}

export async function cleanupTestData() {
  // No-op for now as we're using mocks
  return;
}

export function getAuthHeader(token: string) {
  return {
    'Authorization': `Bearer ${token}`
  };
}
