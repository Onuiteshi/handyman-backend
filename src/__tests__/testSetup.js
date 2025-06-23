"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = void 0;
// Import the manual mock for @prisma/client
const jest_mock_extended_1 = require("jest-mock-extended");
// Create a deep mock of the Prisma client
const prismaMock = (0, jest_mock_extended_1.mockDeep)();
exports.prismaMock = prismaMock;
// Add default mock implementations for artisan-related methods
prismaMock.artisan = {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn()
};
// Mock the Prisma client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock),
    prisma: prismaMock,
}));
// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock implementations
    Object.values(prismaMock).forEach((mock) => {
        if (typeof mock === 'object' && mock !== null) {
            Object.values(mock).forEach((method) => {
                if (typeof method === 'function' && method.mock) {
                    method.mockClear();
                }
            });
        }
    });
    // Set up default mock implementations
    prismaMock.artisan.update.mockImplementation((data) => Promise.resolve(Object.assign({ id: 'test-artisan-id' }, data.data)));
    prismaMock.artisan.findUnique.mockImplementation((data) => Promise.resolve(Object.assign({ id: 'test-artisan-id', isOnline: false, locationTracking: false, latitude: null, longitude: null, lastSeen: null }, data === null || data === void 0 ? void 0 : data.where)));
});
exports.default = prismaMock;
