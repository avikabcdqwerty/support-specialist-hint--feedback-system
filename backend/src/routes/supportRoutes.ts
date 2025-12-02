import { Router } from 'express';
import { authenticateJWT, authorizeSupportSpecialist, authorizeUserOrSupportSpecialist } from '../middleware/authMiddleware';
import { getUserProgress } from '../controllers/progressController';
import { sendHintOrFeedback, getUserHints, markHintAsViewed } from '../controllers/hintController';

// Create router instance
const router = Router();

/**
 * @route   GET /progress/:userId
 * @desc    Support Specialist views user progress logs for users who have requested support
 * @access  Support Specialist (role-based)
 */
router.get(
  '/progress/:userId',
  authenticateJWT,
  authorizeSupportSpecialist,
  getUserProgress
);

/**
 * @route   POST /hint/:userId
 * @desc    Support Specialist sends hint/feedback to a user (only if user has requested support)
 * @access  Support Specialist (role-based)
 * @body    { stepId: string, puzzleId?: string, message: string }
 */
router.post(
  '/hint/:userId',
  authenticateJWT,
  authorizeSupportSpecialist,
  sendHintOrFeedback
);

/**
 * @route   GET /hint
 * @desc    User fetches their received hints/feedback
 * @access  User (only intended user) or Support Specialist (for QA/audit)
 */
router.get(
  '/hint',
  authenticateJWT,
  authorizeUserOrSupportSpecialist,
  getUserHints
);

/**
 * @route   POST /hint/view/:hintId
 * @desc    User marks a hint/feedback as viewed (for audit logging)
 * @access  User (only intended user)
 */
router.post(
  '/hint/view/:hintId',
  authenticateJWT,
  authorizeUserOrSupportSpecialist,
  markHintAsViewed
);

export default router;