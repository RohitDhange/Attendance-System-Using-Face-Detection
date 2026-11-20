import { Router } from 'express';
import {
  markFaceAttendance,
  listAttendances,
  getMyAttendance,
  manualMarkAttendance,
  deleteAttendance,
} from '../controllers/attendanceController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Student routes
router.post('/mark-face', authenticate, markFaceAttendance);
router.get('/my-history', authenticate, getMyAttendance);

// Admin-only routes
router.get('/', authenticate, requireAdmin, listAttendances);
router.post('/manual', authenticate, requireAdmin, manualMarkAttendance);
router.delete('/:id', authenticate, requireAdmin, deleteAttendance);

export default router;

