import { Router } from 'express';
import { getSettings, updateSettings, getAuditLogs } from '../controllers/settingController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Anyone logged in can read settings (e.g. orgName, camera settings)
router.get('/', authenticate, getSettings);

// Admin-only updates and audit logs
router.put('/', authenticate, requireAdmin, updateSettings);
router.get('/audit-logs', authenticate, requireAdmin, getAuditLogs);

export default router;

