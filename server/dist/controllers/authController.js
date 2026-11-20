"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
exports.updatePassword = updatePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'faceattend_jwt_secure_secret_token_key_2026_jwt';
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required.' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: {
                faceProfile: {
                    select: { id: true, registeredAt: true },
                },
            },
        });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ error: 'Account is deactivated. Please contact an administrator.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                studentId: user.studentId,
                department: user.department,
                className: user.className,
                role: user.role,
                isActive: user.isActive,
                avatar: user.avatar,
                hasFaceRegistered: !!user.faceProfile,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
}
async function me(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            include: {
                faceProfile: {
                    select: { id: true, registeredAt: true, facePreview: true },
                },
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                studentId: user.studentId,
                department: user.department,
                className: user.className,
                role: user.role,
                isActive: user.isActive,
                avatar: user.avatar,
                hasFaceRegistered: !!user.faceProfile,
                faceRegisteredAt: user.faceProfile?.registeredAt || null,
                facePreview: user.faceProfile?.facePreview || null,
            },
        });
    }
    catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
}
async function updatePassword(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'Current password and new password are required.' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ error: 'New password must be at least 6 characters.' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({ error: 'Incorrect current password.' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { passwordHash },
        });
        res.json({ message: 'Password updated successfully.' });
    }
    catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Failed to update password.' });
    }
}
