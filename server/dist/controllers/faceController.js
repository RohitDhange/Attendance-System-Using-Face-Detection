"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFace = registerFace;
exports.deleteFace = deleteFace;
exports.getFaceStatus = getFaceStatus;
exports.listFaceProfiles = listFaceProfiles;
exports.verifyFace = verifyFace;
const prisma_1 = __importDefault(require("../prisma"));
const crypto_1 = require("../utils/crypto");
async function registerFace(req, res) {
    try {
        const { userId, descriptor, facePreview } = req.body;
        if (!userId || !descriptor) {
            res.status(400).json({ error: 'userId and face descriptor are required.' });
            return;
        }
        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            res.status(400).json({ error: 'Invalid face descriptor format. Must be a 128-float array.' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        // Encrypt embedding with AES-256-GCM
        const encryptedEmbedding = (0, crypto_1.encryptEmbedding)(descriptor);
        const faceProfile = await prisma_1.default.faceProfile.upsert({
            where: { userId },
            create: {
                userId,
                encryptedEmbedding,
                facePreview: facePreview || null,
            },
            update: {
                encryptedEmbedding,
                facePreview: facePreview || null,
                updatedAt: new Date(),
            },
        });
        await prisma_1.default.auditLog.create({
            data: {
                action: 'FACE_REGISTERED',
                performedBy: req.user?.fullName || 'ADMIN',
                userId,
                details: JSON.stringify({
                    fullName: user.fullName,
                    studentId: user.studentId,
                    registeredAt: faceProfile.updatedAt,
                }),
            },
        });
        res.json({
            message: 'Face registered successfully and biometric embedding encrypted.',
            faceProfile: {
                id: faceProfile.id,
                userId: faceProfile.userId,
                registeredAt: faceProfile.registeredAt,
                updatedAt: faceProfile.updatedAt,
                facePreview: faceProfile.facePreview,
            },
        });
    }
    catch (error) {
        console.error('Register face error:', error);
        res.status(500).json({ error: 'Failed to register face embedding.' });
    }
}
async function deleteFace(req, res) {
    try {
        const { userId } = req.params;
        const existing = await prisma_1.default.faceProfile.findUnique({
            where: { userId },
            include: { user: { select: { fullName: true, studentId: true } } },
        });
        if (!existing) {
            res.status(404).json({ error: 'No face profile registered for this user.' });
            return;
        }
        await prisma_1.default.faceProfile.delete({ where: { userId } });
        await prisma_1.default.auditLog.create({
            data: {
                action: 'FACE_DELETED',
                performedBy: req.user?.fullName || 'ADMIN',
                userId,
                details: JSON.stringify({
                    fullName: existing.user.fullName,
                    studentId: existing.user.studentId,
                }),
            },
        });
        res.json({ message: 'Face registration deleted successfully.' });
    }
    catch (error) {
        console.error('Delete face error:', error);
        res.status(500).json({ error: 'Failed to delete face profile.' });
    }
}
async function getFaceStatus(req, res) {
    try {
        const { userId } = req.params;
        const faceProfile = await prisma_1.default.faceProfile.findUnique({
            where: { userId },
            select: {
                id: true,
                registeredAt: true,
                updatedAt: true,
                facePreview: true,
            },
        });
        res.json({
            hasFaceRegistered: !!faceProfile,
            registeredAt: faceProfile?.registeredAt || null,
            updatedAt: faceProfile?.updatedAt || null,
            facePreview: faceProfile?.facePreview || null,
        });
    }
    catch (error) {
        console.error('Face status error:', error);
        res.status(500).json({ error: 'Failed to get face status.' });
    }
}
async function listFaceProfiles(req, res) {
    try {
        const { search = '', department = '' } = req.query;
        const where = {
            faceProfile: { isNot: null },
        };
        if (search) {
            const q = String(search).trim();
            where.OR = [
                { fullName: { contains: q } },
                { email: { contains: q } },
                { studentId: { contains: q } },
            ];
        }
        if (department && department !== 'ALL') {
            where.department = String(department);
        }
        const users = await prisma_1.default.user.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                studentId: true,
                email: true,
                department: true,
                className: true,
                faceProfile: {
                    select: {
                        id: true,
                        registeredAt: true,
                        updatedAt: true,
                        facePreview: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json({
            faces: users.map((u) => ({
                userId: u.id,
                fullName: u.fullName,
                studentId: u.studentId,
                email: u.email,
                department: u.department,
                className: u.className,
                registeredAt: u.faceProfile?.registeredAt,
                updatedAt: u.faceProfile?.updatedAt,
                facePreview: u.faceProfile?.facePreview,
            })),
        });
    }
    catch (error) {
        console.error('List face profiles error:', error);
        res.status(500).json({ error: 'Failed to fetch face profiles.' });
    }
}
/**
 * Verify a live scanned descriptor against the user's stored encrypted embedding
 */
async function verifyFace(req, res) {
    try {
        const targetUserId = req.body.userId || req.user?.id;
        const { descriptor } = req.body;
        if (!targetUserId || !descriptor || !Array.isArray(descriptor)) {
            res.status(400).json({ error: 'Missing userId or valid descriptor array.' });
            return;
        }
        const faceProfile = await prisma_1.default.faceProfile.findUnique({
            where: { userId: targetUserId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        studentId: true,
                        department: true,
                        className: true,
                        isActive: true,
                    },
                },
            },
        });
        if (!faceProfile) {
            res.status(404).json({
                matched: false,
                error: 'No registered face profile found for this user. Please register your face first.',
            });
            return;
        }
        if (!faceProfile.user.isActive) {
            res.status(403).json({
                matched: false,
                error: 'User account is inactive. Please contact an administrator.',
            });
            return;
        }
        // Get system matching threshold
        const thresholdSetting = await prisma_1.default.systemSetting.findUnique({
            where: { key: 'matchingThreshold' },
        });
        const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 0.50;
        // Decrypt stored embedding and compute euclidean distance
        const storedDescriptor = (0, crypto_1.decryptEmbedding)(faceProfile.encryptedEmbedding);
        const distance = (0, crypto_1.computeEuclideanDistance)(descriptor, storedDescriptor);
        const isMatched = distance <= threshold;
        const confidence = (0, crypto_1.distanceToConfidence)(distance, threshold);
        res.json({
            matched: isMatched,
            distance: Number(distance.toFixed(4)),
            confidence,
            threshold,
            user: {
                id: faceProfile.user.id,
                fullName: faceProfile.user.fullName,
                studentId: faceProfile.user.studentId,
                department: faceProfile.user.department,
                className: faceProfile.user.className,
            },
        });
    }
    catch (error) {
        console.error('Verify face error:', error);
        res.status(500).json({ error: 'Face verification failed.' });
    }
}
