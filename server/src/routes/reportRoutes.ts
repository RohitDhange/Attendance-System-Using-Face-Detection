import { Router } from 'express';
import { getDashboardOverview, getDetailedReports } from '../controllers/reportController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/overview', authenticate, requireAdmin, getDashboardOverview);
router.get('/detailed', authenticate, requireAdmin, getDetailedReports);

export default router;

