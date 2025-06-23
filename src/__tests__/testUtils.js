"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockArtisan = exports.mockCategory = exports.testUsers = void 0;
exports.setupTestData = setupTestData;
exports.cleanupTestData = cleanupTestData;
exports.getAuthHeader = getAuthHeader;
exports.testUsers = {
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
};
// Mock data
exports.mockCategory = {
    id: 'test-category-id',
    name: 'Test Category',
    description: 'Test Description',
    createdAt: new Date(),
    updatedAt: new Date(),
};
exports.mockArtisan = {
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
function setupTestData() {
    return __awaiter(this, void 0, void 0, function* () {
        // No-op for now as we're using mocks
        return;
    });
}
function cleanupTestData() {
    return __awaiter(this, void 0, void 0, function* () {
        // No-op for now as we're using mocks
        return;
    });
}
function getAuthHeader(token) {
    return {
        'Authorization': `Bearer ${token}`
    };
}
