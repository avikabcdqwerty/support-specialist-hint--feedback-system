import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logAuditEvent } from '../services/auditLogger';
import { sendNotificationToUser } from '../services/notificationService';

const prisma = new PrismaClient();

/**
 * Controller for Support Specialist to send a hint or feedback to a user.
 * Only allowed if the user has an open support request.
 *
 * Expects body: { stepId: string, puzzleId?: string, message: string }
 */
export const sendHintOrFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { userId } = req.params;
  const { stepId, puzzleId, message } = req.body;

  try {
    // Validate input
    if (!stepId || !message) {
      return res.status(400).json({ error: 'stepId and message are required.' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check for open support request
    const supportRequest = await prisma.supportRequest.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
    });
    if (!supportRequest) {
      return res.status(403).json({ error: 'Cannot send hint: user has not requested support.' });
    }

    // Create hint/feedback record
    const hint = await prisma.hint.create({
      data: {
        userId,
        supportRequestId: supportRequest.id,
        stepId,
        puzzleId,
        message,
        sentById: req.user?.id || null,
        sentByRole: req.user?.role || null,
        status: 'UNREAD',
      },
    });

    // Log audit event
    await logAuditEvent({
      actorId: req.user?.id || 'unknown',
      actorRole: req.user?.role || 'unknown',
      action: 'SEND_HINT',
      targetUserId: userId,
      metadata: {
        hintId: hint.id,
        supportRequestId: supportRequest.id,
        stepId,
        puzzleId,
      },
    });

    // Send notification to user (real-time or push)
    await sendNotificationToUser(userId, {
      type: 'HINT',
      hintId: hint.id,
      message,
      stepId,
      puzzleId,
      sentAt: hint.createdAt,
    });

    res.status(201).json({
      message: 'Hint/feedback sent successfully.',
      hint: {
        id: hint.id,
        stepId: hint.stepId,
        puzzleId: hint.puzzleId,
        message: hint.message,
        sentAt: hint.createdAt,
        status: hint.status,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending hint/feedback:', error);
    next(error);
  }
};

/**
 * Controller for user or support specialist to fetch hints/feedback for a user.
 * - Users can only fetch their own hints.
 * - Support specialists can fetch for any user (for QA/audit).
 */
export const getUserHints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let userId: string | undefined;

    // If support specialist, allow query param to specify userId
    if (req.user?.role === 'support_specialist' || req.user?.role === 'admin') {
      userId = req.query.userId as string;
    } else {
      // For users, only allow their own
      userId = req.user?.id;
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    // Fetch hints for the user, most recent first
    const hints = await prisma.hint.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        stepId: true,
        puzzleId: true,
        message: true,
        status: true,
        createdAt: true,
        viewedAt: true,
        sentById: true,
        sentByRole: true,
      },
    });

    // Log audit event
    await logAuditEvent({
      actorId: req.user?.id || 'unknown',
      actorRole: req.user?.role || 'unknown',
      action: 'VIEW_HINT_LIST',
      targetUserId: userId,
      metadata: {},
    });

    res.status(200).json({ hints });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user hints:', error);
    next(error);
  }
};

/**
 * Controller for user to mark a hint as viewed (for audit logging).
 * Only the intended user can mark their hint as viewed.
 */
export const markHintAsViewed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { hintId } = req.params;

  try {
    // Fetch hint
    const hint = await prisma.hint.findUnique({
      where: { id: hintId },
    });

    if (!hint) {
      return res.status(404).json({ error: 'Hint not found.' });
    }

    // Only the intended user can mark as viewed
    if (req.user?.id !== hint.userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Update hint status and viewedAt
    const updatedHint = await prisma.hint.update({
      where: { id: hintId },
      data: {
        status: 'VIEWED',
        viewedAt: new Date(),
      },
    });

    // Log audit event
    await logAuditEvent({
      actorId: req.user?.id || 'unknown',
      actorRole: req.user?.role || 'unknown',
      action: 'VIEW_HINT',
      targetUserId: hint.userId,
      metadata: {
        hintId: hint.id,
        viewedAt: updatedHint.viewedAt,
      },
    });

    res.status(200).json({
      message: 'Hint marked as viewed.',
      hint: {
        id: updatedHint.id,
        status: updatedHint.status,
        viewedAt: updatedHint.viewedAt,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error marking hint as viewed:', error);
    next(error);
  }
};