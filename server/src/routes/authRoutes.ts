import { Router } from 'express';
import { login, me, updatePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/update-password', authenticate, updatePassword);

export default router;

