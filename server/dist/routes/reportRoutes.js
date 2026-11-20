"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/overview', auth_1.authenticate, auth_1.requireAdmin, reportController_1.getDashboardOverview);
router.get('/detailed', auth_1.authenticate, auth_1.requireAdmin, reportController_1.getDetailedReports);
exports.default = router;
