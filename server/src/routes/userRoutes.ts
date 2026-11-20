import { Router } from 'express';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getDepartments,
} from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Allow authenticated users to view department list (e.g. for filters)
router.get('/departments', authenticate, getDepartments);

// Admin-only management routes
router.get('/', authenticate, requireAdmin, listUsers);
router.post('/', authenticate, requireAdmin, createUser);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, requireAdmin, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);
router.patch('/:id/toggle-status', authenticate, requireAdmin, toggleUserStatus);

export default router;

