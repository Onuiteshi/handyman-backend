"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_1 = require("../generated/prisma"); // Update import path to use generated client
// Create a singleton instance of PrismaClient
const prisma = new prisma_1.PrismaClient();
exports.prisma = prisma;
