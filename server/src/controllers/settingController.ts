import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {
      lateThresholdTime: '09:30',
      matchingThreshold: '0.50',
      orgName: 'Apex Institute of Technology',
      allowCameraFlip: 'true',
    };

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({ settings: settingsMap });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({ error: 'Settings object required.' });
      return;
    }

    const updates = Object.entries(settings).map(([key, val]) =>
      prisma.systemSetting.upsert({
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
      })
    );

    await Promise.all(updates);

    await prisma.auditLog.create({
      data: {
        action: 'SETTINGS_UPDATED',
        performedBy: req.user?.fullName || 'ADMIN',
        details: JSON.stringify(settings),
      },
    });

    res.json({ message: 'System settings saved successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { fullName: true, studentId: true, email: true },
        },
      },
    });

    res.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
}

