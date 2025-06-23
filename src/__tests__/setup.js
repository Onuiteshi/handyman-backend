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
exports.prisma = void 0;
const __1 = require("..");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return __1.prisma; } });
const testUtils_1 = require("./testUtils");
// Set a longer timeout for the beforeAll hook
jest.setTimeout(30000); // 30 seconds
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Set the test database URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/handyman_test';
    // Initialize test data
    yield (0, testUtils_1.setupTestData)();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up the test database
    yield __1.prisma.$disconnect();
}));
