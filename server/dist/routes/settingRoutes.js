"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingController_1 = require("../controllers/settingController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Anyone logged in can read settings (e.g. orgName, camera settings)
router.get('/', auth_1.authenticate, settingController_1.getSettings);
// Admin-only updates and audit logs
router.put('/', auth_1.authenticate, auth_1.requireAdmin, settingController_1.updateSettings);
router.get('/audit-logs', auth_1.authenticate, auth_1.requireAdmin, settingController_1.getAuditLogs);
exports.default = router;
