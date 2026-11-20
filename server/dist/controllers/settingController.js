"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.getAuditLogs = getAuditLogs;
const prisma_1 = __importDefault(require("../prisma"));
async function getSettings(req, res) {
    try {
        const settings = await prisma_1.default.systemSetting.findMany();
        const settingsMap = {
            lateThresholdTime: '09:30',
            matchingThreshold: '0.50',
            orgName: 'Apex Institute of Technology',
            allowCameraFlip: 'true',
        };
        settings.forEach((s) => {
            settingsMap[s.key] = s.value;
        });
        res.json({ settings: settingsMap });
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
}
async function updateSettings(req, res) {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            res.status(400).json({ error: 'Settings object required.' });
            return;
        }
        const updates = Object.entries(settings).map(([key, val]) => prisma_1.default.systemSetting.upsert({
            where: { key },
            create: {
                key,
                value: String(val),
                description: `Configuration for ${key}`,
            },
            update: {
                value: String(val),
                updatedAt: new Date(),
            },
        }));
        await Promise.all(updates);
        await prisma_1.default.auditLog.create({
            data: {
                action: 'SETTINGS_UPDATED',
                performedBy: req.user?.fullName || 'ADMIN',
                details: JSON.stringify(settings),
            },
        });
        res.json({ message: 'System settings saved successfully.' });
    }
    catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
}
async function getAuditLogs(req, res) {
    try {
        const logs = await prisma_1.default.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: {
                    select: { fullName: true, studentId: true, email: true },
                },
            },
        });
        res.json({ logs });
    }
    catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
}
