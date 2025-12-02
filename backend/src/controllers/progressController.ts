import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logAuditEvent } from '../services/auditLogger';

const prisma = new PrismaClient();

/**
 * Controller to fetch and display user progress logs for support specialists.
 * Only accessible if the user has requested support.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const getUserProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId } = req.params;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if user has requested support
    const supportRequest = await prisma.supportRequest.findFirst({
      where: {
        userId,
        status: 'OPEN', // Only allow if support request is open
      },
      select: { id: true, createdAt: true },
    });

    if (!supportRequest) {
      return res.status(403).json({ error: 'No active support request for this user.' });
    }

    // Fetch user progress logs (steps, puzzles, timestamps, status)
    const progressLogs = await prisma.progressLog.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        stepId: true,
        puzzleId: true,
        status: true,
        updatedAt: true,
        details: true,
      },
    });

    // Find the latest step/puzzle where the user is stuck (status === 'STUCK')
    const stuckLog = progressLogs.find((log) => log.status === 'STUCK');

    // Audit log: Support Specialist viewed user progress
    await logAuditEvent({
      actorId: req.user?.id || 'unknown',
      actorRole: req.user?.role || 'unknown',
      action: 'VIEW_USER_PROGRESS',
      targetUserId: userId,
      metadata: {
        supportRequestId: supportRequest.id,
        viewedAt: new Date().toISOString(),
      },
    });

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
      },
      supportRequest: {
        id: supportRequest.id,
        createdAt: supportRequest.createdAt,
      },
      progressLogs,
      stuckStepOrPuzzle: stuckLog
        ? {
            stepId: stuckLog.stepId,
            puzzleId: stuckLog.puzzleId,
            status: stuckLog.status,
            updatedAt: stuckLog.updatedAt,
            details: stuckLog.details,
          }
        : null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user progress:', error);
    next(error);
  }
};