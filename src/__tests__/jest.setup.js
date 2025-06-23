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
// Load environment variables from .env.test
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
// Import test setup
require("./testSetup");
// Set a longer timeout for tests
jest.setTimeout(30000);
// Global test setup
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Set the test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    // Use DATABASE_URL from .env.test file, with fallback
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://handyman_user:handyman_password@localhost:5432/handyman_test';
}));
// Reset all mocks between tests
afterEach(() => {
    jest.clearAllMocks();
});
// Clean up after all tests
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    jest.restoreAllMocks();
}));
