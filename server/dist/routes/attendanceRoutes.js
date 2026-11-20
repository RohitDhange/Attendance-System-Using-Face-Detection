"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_1 = require("../controllers/attendanceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Student routes
router.post('/mark-face', auth_1.authenticate, attendanceController_1.markFaceAttendance);
router.get('/my-history', auth_1.authenticate, attendanceController_1.getMyAttendance);
// Admin-only routes
router.get('/', auth_1.authenticate, auth_1.requireAdmin, attendanceController_1.listAttendances);
router.post('/manual', auth_1.authenticate, auth_1.requireAdmin, attendanceController_1.manualMarkAttendance);
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, attendanceController_1.deleteAttendance);
exports.default = router;
