import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  decryptEmbedding,
  computeEuclideanDistance,
  distanceToConfidence,
} from '../utils/crypto';

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Determine if check-in time is LATE or PRESENT based on system setting 'lateThresholdTime'
 * Default late threshold: 09:30 AM
 */
async function determineAttendanceStatus(checkInDate: Date): Promise<'PRESENT' | 'LATE'> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'lateThresholdTime' },
  });
  const threshold = setting ? setting.value : '09:30';
  const [thresholdHours, thresholdMinutes] = threshold.split(':').map((s) => parseInt(s, 10));

  const checkInHours = checkInDate.getHours();
  const checkInMinutes = checkInDate.getMinutes();

  if (
    checkInHours > thresholdHours ||
    (checkInHours === thresholdHours && checkInMinutes > thresholdMinutes)
  ) {
    return 'LATE';
  }
  return 'PRESENT';
}

/**
 * Mark Attendance via Face Recognition
 */
export async function markFaceAttendance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const targetUserId = req.body.userId || req.user?.id;
    const { descriptor } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'User ID is required.' });
      return;
    }

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      res.status(400).json({ error: 'Valid 128-float face descriptor is required.' });
      return;
    }

    // 1. Check if user exists & is active
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        faceProfile: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
      return;
    }

    if (!user.faceProfile) {
      res.status(400).json({
        error: 'Face not registered yet. Please have an administrator register your face.',
        code: 'FACE_NOT_REGISTERED',
      });
      return;
    }

    // 2. Check today's duplicate attendance
    const today = getTodayDateString();
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        user_daily_attendance: {
          userId: targetUserId,
          attendanceDate: today,
        },
      },
    });

    if (existingAttendance) {
      res.status(409).json({
        error: 'Your attendance has already been marked today.',
        code: 'ALREADY_MARKED',
        attendance: {
          id: existingAttendance.id,
          userName: user.fullName,
          studentId: user.studentId,
          department: user.department,
          date: existingAttendance.attendanceDate,
          checkInTime: existingAttendance.checkInTime,
          status: existingAttendance.status,
          confidence: existingAttendance.confidence,
        },
      });
      return;
    }

    // 3. Match face descriptor against stored encrypted embedding
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'matchingThreshold' },
    });
    const threshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 0.50;

    const storedDescriptor = decryptEmbedding(user.faceProfile.encryptedEmbedding);
    const distance = computeEuclideanDistance(descriptor, storedDescriptor);

    if (distance > threshold) {
      res.status(400).json({
        error: 'Face Not Recognized. Please Try Again.',
        code: 'FACE_NOT_MATCHED',
        distance: Number(distance.toFixed(4)),
        threshold,
      });
      return;
    }

    // 4. Face matched! Calculate status (PRESENT vs LATE)
    const now = new Date();
    const status = await determineAttendanceStatus(now);
    const confidence = distanceToConfidence(distance, threshold);

    // 5. Save attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: targetUserId,
        attendanceDate: today,
        checkInTime: now,
        status,
        verificationMethod: 'FACE_RECOGNITION',
        confidence,
        notes: `Recognized with distance ${distance.toFixed(4)} and confidence ${confidence}%`,
      },
    });

    res.status(201).json({
      message: 'Attendance Marked Successfully!',
      attendance: {
        id: attendance.id,
        userName: user.fullName,
        studentId: user.studentId,
        department: user.department,
        className: user.className,
        date: attendance.attendanceDate,
        checkInTime: attendance.checkInTime,
        status: attendance.status,
        confidence: attendance.confidence,
        verificationMethod: attendance.verificationMethod,
      },
    });
  } catch (error) {
    console.error('Mark face attendance error:', error);
    res.status(500).json({ error: 'Failed to record face attendance.' });
  }
}

/**
 * Get attendance records with rich filtering and pagination
 */
export async function listAttendances(req: Request, res: Response): Promise<void> {
  try {
    const {
      date = '',
      startDate = '',
      endDate = '',
      userId = '',
      department = '',
      status = '',
      search = '',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (date) {
      where.attendanceDate = String(date);
    } else if (startDate && endDate) {
      where.attendanceDate = {
        gte: String(startDate),
        lte: String(endDate),
      };
    }

    if (userId) {
      where.userId = String(userId);
    }

    if (status && ['PRESENT', 'LATE', 'ABSENT'].includes(String(status))) {
      where.status = String(status);
    }

    const userWhere: any = {};
    if (department && department !== 'ALL') {
      userWhere.department = String(department);
    }

    if (search) {
      const q = String(search).trim();
      userWhere.OR = [
        { fullName: { contains: q } },
        { studentId: { contains: q } },
        { email: { contains: q } },
      ];
    }

    if (Object.keys(userWhere).length > 0) {
      where.user = userWhere;
    }

    const [total, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              email: true,
              department: true,
              className: true,
              avatar: true,
            },
          },
        },
        orderBy: [{ attendanceDate: 'desc' }, { checkInTime: 'desc' }],
        skip,
        take,
      }),
    ]);

    res.json({
      attendances: attendances.map((a) => ({
        id: a.id,
        userId: a.userId,
        studentId: a.user.studentId,
        userName: a.user.fullName,
        email: a.user.email,
        department: a.user.department,
        className: a.user.className,
        date: a.attendanceDate,
        checkInTime: a.checkInTime,
        status: a.status,
        confidence: a.confidence,
        verificationMethod: a.verificationMethod,
        notes: a.notes,
      })),
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('List attendances error:', error);
    res.status(500).json({ error: 'Failed to retrieve attendance records.' });
  }
}

/**
 * Get student's personal attendance history
 */
export async function getMyAttendance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;
    const today = getTodayDateString();

    const [attendances, todayRecord, totalPresent, totalLate] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId },
        orderBy: { attendanceDate: 'desc' },
        take: 100,
      }),
      prisma.attendance.findUnique({
        where: {
          user_daily_attendance: {
            userId,
            attendanceDate: today,
          },
        },
      }),
      prisma.attendance.count({
        where: { userId, status: 'PRESENT' },
      }),
      prisma.attendance.count({
        where: { userId, status: 'LATE' },
      }),
    ]);

    const totalDaysRecorded = attendances.length;
    const totalAttended = totalPresent + totalLate;
    const percentage = totalDaysRecorded > 0 ? Math.round((totalAttended / totalDaysRecorded) * 100) : 0;

    res.json({
      todayAttendance: todayRecord
        ? {
            id: todayRecord.id,
            status: todayRecord.status,
            checkInTime: todayRecord.checkInTime,
            confidence: todayRecord.confidence,
            verificationMethod: todayRecord.verificationMethod,
          }
        : null,
      stats: {
        totalPresent,
        totalLate,
        totalAttended,
        totalDaysRecorded,
        attendancePercentage: percentage,
      },
      history: attendances.map((a) => ({
        id: a.id,
        date: a.attendanceDate,
        checkInTime: a.checkInTime,
        status: a.status,
        confidence: a.confidence,
        verificationMethod: a.verificationMethod,
      })),
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Failed to load attendance history.' });
  }
}

/**
 * Manual Attendance Mark or Update (Admin only)
 */
export async function manualMarkAttendance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userId, date, status, notes } = req.body;

    if (!userId || !date || !status) {
      res.status(400).json({ error: 'userId, date, and status are required.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const checkInTime = new Date(`${date}T09:00:00`);

    const record = await prisma.attendance.upsert({
      where: {
        user_daily_attendance: {
          userId,
          attendanceDate: date,
        },
      },
      create: {
        userId,
        attendanceDate: date,
        checkInTime,
        status,
        verificationMethod: 'MANUAL_ADMIN',
        notes: notes || `Manually marked by ${req.user?.fullName || 'Admin'}`,
      },
      update: {
        status,
        verificationMethod: 'MANUAL_ADMIN',
        notes: notes || `Updated manually by ${req.user?.fullName || 'Admin'}`,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ATTENDANCE_MANUAL_UPDATE',
        performedBy: req.user?.fullName || 'ADMIN',
        userId,
        details: JSON.stringify({ date, status, notes }),
      },
    });

    res.json({
      message: 'Attendance record updated successfully',
      attendance: record,
    });
  } catch (error) {
    console.error('Manual mark error:', error);
    res.status(500).json({ error: 'Failed to record manual attendance.' });
  }
}

/**
 * Delete attendance record (Admin only)
 */
export async function deleteAttendance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const record = await prisma.attendance.findUnique({ where: { id } });
    if (!record) {
      res.status(404).json({ error: 'Attendance record not found.' });
      return;
    }

    await prisma.attendance.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'ATTENDANCE_DELETED',
        performedBy: req.user?.fullName || 'ADMIN',
        userId: record.userId,
        details: JSON.stringify({ date: record.attendanceDate, id }),
      },
    });

    res.json({ message: 'Attendance record deleted successfully.' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
}

