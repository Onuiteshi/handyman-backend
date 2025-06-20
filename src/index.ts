import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import artisanRoutes from './routes/artisan.routes';
import serviceCategoryRoutes from './routes/serviceCategory.routes';
import uploadRoutes from './routes/upload.routes';
import artisanStatusRoutes from './routes/artisanStatus.routes';
import prisma from './lib/prisma';

dotenv.config();

const app = express();

// Test database connection
prisma.$connect()
  .then(() => console.log('Successfully connected to the database'))
  .catch((error) => console.error('Error connecting to the database:', error));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
const apiRouter = express.Router();

// Mount all API routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/artisans', artisanRoutes);
apiRouter.use('/service-categories', serviceCategoryRoutes);
apiRouter.use('/uploads', uploadRoutes);
apiRouter.use('/artisan', artisanStatusRoutes);

app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    status: err.status || 500
  });
});

// Export the Express app for testing
export { app };

// Start the server only if this file is run directly
if (require.main === module) {
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
