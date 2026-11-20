import { Request, Response } from 'express';
import prisma from '../prisma';

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function getDashboardOverview(req: Request, res: Response): Promise<void> {
  try {
    const today = getTodayDateString();

    const [
      totalUsers,
      totalStudents,
      totalFacesRegistered,
      todayAttendances,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER', isActive: true } }),
      prisma.faceProfile.count(),
      prisma.attendance.findMany({
        where: { attendanceDate: today },
        include: {
          user: {
            select: {
              fullName: true,
              studentId: true,
              department: true,
              className: true,
            },
          },
        },
      }),
      prisma.attendance.findMany({
        take: 10,
        orderBy: { checkInTime: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              department: true,
              className: true,
            },
          },
        },
      }),
    ]);

    const todayPresentCount = todayAttendances.filter((a) => a.status === 'PRESENT').length;
    const todayLateCount = todayAttendances.filter((a) => a.status === 'LATE').length;
    const todayTotalAttended = todayPresentCount + todayLateCount;
    const todayAbsentCount = Math.max(0, totalStudents - todayTotalAttended);
    const attendancePercentage = totalStudents > 0
      ? Math.round((todayTotalAttended / totalStudents) * 100)
      : 0;

    // Last 7 days trend
    const last7Days: { date: string; present: number; late: number; absent: number; percentage: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // In sqlite, query for each date
      const dayRecords = await prisma.attendance.findMany({
        where: { attendanceDate: dateStr },
        select: { status: true },
      });

      const dayPresent = dayRecords.filter((r) => r.status === 'PRESENT').length;
      const dayLate = dayRecords.filter((r) => r.status === 'LATE').length;
      const dayAttended = dayPresent + dayLate;
      const dayAbsent = Math.max(0, totalStudents - dayAttended);
      const dayPercentage = totalStudents > 0 ? Math.round((dayAttended / totalStudents) * 100) : 0;

      last7Days.push({
        date: dateStr,
        present: dayPresent,
        late: dayLate,
        absent: dayAbsent,
        percentage: dayPercentage,
      });
    }

    res.json({
      metrics: {
        totalUsers,
        totalStudents,
        totalFacesRegistered,
        todayPresent: todayPresentCount,
        todayLate: todayLateCount,
        todayAbsent: todayAbsentCount,
        todayAttended: todayTotalAttended,
        attendancePercentage,
      },
      last7DaysTrend: last7Days,
      todayAttendances: todayAttendances.map((a) => ({
        id: a.id,
        userName: a.user.fullName,
        studentId: a.user.studentId,
        department: a.user.department,
        className: a.user.className,
        checkInTime: a.checkInTime,
        status: a.status,
        confidence: a.confidence,
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        userName: a.user.fullName,
        studentId: a.user.studentId,
        department: a.user.department,
        className: a.user.className,
        date: a.attendanceDate,
        checkInTime: a.checkInTime,
        status: a.status,
        confidence: a.confidence,
        verificationMethod: a.verificationMethod,
      })),
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to generate dashboard overview.' });
  }
}

export async function getDetailedReports(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, department } = req.query;

    const userWhere: any = { role: 'USER', isActive: true };
    if (department && department !== 'ALL') {
      userWhere.department = String(department);
    }

    const students = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        fullName: true,
        studentId: true,
        department: true,
        className: true,
      },
    });

    const attWhere: any = {};
    if (startDate && endDate) {
      attWhere.attendanceDate = {
        gte: String(startDate),
        lte: String(endDate),
      };
    }
    if (department && department !== 'ALL') {
      attWhere.user = { department: String(department) };
    }

    const attendances = await prisma.attendance.findMany({
      where: attWhere,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
            department: true,
            className: true,
          },
        },
      },
      orderBy: { attendanceDate: 'desc' },
    });

    // Department breakdown
    const departmentStats: Record<
      string,
      { totalStudents: number; present: number; late: number; rate: number }
    > = {};

    students.forEach((s) => {
      if (!departmentStats[s.department]) {
        departmentStats[s.department] = {
          totalStudents: 0,
          present: 0,
          late: 0,
          rate: 0,
        };
      }
      departmentStats[s.department].totalStudents += 1;
    });

    attendances.forEach((a) => {
      const dept = a.user.department;
      if (departmentStats[dept]) {
        if (a.status === 'PRESENT') departmentStats[dept].present += 1;
        if (a.status === 'LATE') departmentStats[dept].late += 1;
      }
    });

    const departmentList = Object.keys(departmentStats).map((dept) => {
      const data = departmentStats[dept];
      const attended = data.present + data.late;
      const rate = data.totalStudents > 0 ? Math.round((attended / data.totalStudents) * 100) : 0;
      return {
        department: dept,
        totalStudents: data.totalStudents,
        present: data.present,
        late: data.late,
        attendanceRate: rate,
      };
    });

    // Status distribution
    const statusCounts = {
      PRESENT: attendances.filter((a) => a.status === 'PRESENT').length,
      LATE: attendances.filter((a) => a.status === 'LATE').length,
      ABSENT: attendances.filter((a) => a.status === 'ABSENT').length,
    };

    res.json({
      summary: {
        totalRecords: attendances.length,
        totalStudents: students.length,
        statusCounts,
      },
      departmentList,
      attendances: attendances.slice(0, 100).map((a) => ({
        id: a.id,
        userName: a.user.fullName,
        studentId: a.user.studentId,
        department: a.user.department,
        className: a.user.className,
        date: a.attendanceDate,
        checkInTime: a.checkInTime,
        status: a.status,
        confidence: a.confidence,
        verificationMethod: a.verificationMethod,
      })),
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to generate reports.' });
  }
}

