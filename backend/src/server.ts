import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import supportRoutes from './routes/supportRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './services/notificationService';

// Load environment variables from .env file
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Express application
const app: Application = express();

// Middleware: Security headers
app.use(helmet());

// Middleware: Enable CORS with secure defaults
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Middleware: JSON body parsing
app.use(express.json());

// Middleware: HTTP request logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/support', supportRoutes);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Centralized error handler
app.use(errorHandler);

// Create HTTP server for Socket.io integration
const server = http.createServer(app);

// Initialize Socket.io for real-time notifications
initializeSocket(server);

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Backend server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;