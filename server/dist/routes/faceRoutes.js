"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const faceController_1 = require("../controllers/faceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Student can verify their face; Admin can verify any face
router.post('/verify', auth_1.authenticate, faceController_1.verifyFace);
// Admin-only face registration and management
router.post('/register', auth_1.authenticate, auth_1.requireAdmin, faceController_1.registerFace);
router.delete('/:userId', auth_1.authenticate, auth_1.requireAdmin, faceController_1.deleteFace);
router.get('/status/:userId', auth_1.authenticate, faceController_1.getFaceStatus);
router.get('/list', auth_1.authenticate, auth_1.requireAdmin, faceController_1.listFaceProfiles);
exports.default = router;
