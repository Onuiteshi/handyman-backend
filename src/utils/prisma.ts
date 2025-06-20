import { PrismaClient } from '../generated/prisma'; // Update import path to use generated client

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient();

export { prisma };
