import { Router } from 'express';
import {
  registerFace,
  deleteFace,
  getFaceStatus,
  listFaceProfiles,
  verifyFace,
} from '../controllers/faceController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Student can verify their face; Admin can verify any face
router.post('/verify', authenticate, verifyFace);

// Admin-only face registration and management
router.post('/register', authenticate, requireAdmin, registerFace);
router.delete('/:userId', authenticate, requireAdmin, deleteFace);
router.get('/status/:userId', authenticate, getFaceStatus);
router.get('/list', authenticate, requireAdmin, listFaceProfiles);

export default router;

