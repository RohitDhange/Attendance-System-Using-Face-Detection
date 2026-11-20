"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Allow authenticated users to view department list (e.g. for filters)
router.get('/departments', auth_1.authenticate, userController_1.getDepartments);
// Admin-only management routes
router.get('/', auth_1.authenticate, auth_1.requireAdmin, userController_1.listUsers);
router.post('/', auth_1.authenticate, auth_1.requireAdmin, userController_1.createUser);
router.get('/:id', auth_1.authenticate, userController_1.getUserById);
router.put('/:id', auth_1.authenticate, auth_1.requireAdmin, userController_1.updateUser);
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, userController_1.deleteUser);
router.patch('/:id/toggle-status', auth_1.authenticate, auth_1.requireAdmin, userController_1.toggleUserStatus);
exports.default = router;
