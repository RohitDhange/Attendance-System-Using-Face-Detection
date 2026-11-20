import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const {
      search = '',
      department = '',
      className = '',
      role = '',
      faceStatus = '',
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * take;

    const today = getTodayDateString();

    const where: any = {};

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

    if (className && className !== 'ALL') {
      where.className = String(className);
    }

    if (role && (role === 'ADMIN' || role === 'USER')) {
      where.role = role;
    }

    if (faceStatus === 'REGISTERED') {
      where.faceProfile = { isNot: null };
    } else if (faceStatus === 'NOT_REGISTERED') {
      where.faceProfile = null;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          studentId: true,
          department: true,
          className: true,
          role: true,
          isActive: true,
          avatar: true,
          createdAt: true,
          faceProfile: {
            select: {
              id: true,
              registeredAt: true,
              facePreview: true,
            },
          },
          attendances: {
            where: { attendanceDate: today },
            select: {
              id: true,
              status: true,
              checkInTime: true,
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      studentId: u.studentId,
      department: u.department,
      className: u.className,
      role: u.role,
      isActive: u.isActive,
      avatar: u.avatar,
      createdAt: u.createdAt,
      hasFaceRegistered: !!u.faceProfile,
      faceRegisteredAt: u.faceProfile?.registeredAt || null,
      facePreview: u.faceProfile?.facePreview || null,
      todayAttendance: u.attendances[0]
        ? {
            status: u.attendances[0].status,
            checkInTime: u.attendances[0].checkInTime,
          }
        : null,
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        faceProfile: {
          select: { id: true, registeredAt: true, facePreview: true },
        },
        attendances: {
          orderBy: { attendanceDate: 'desc' },
          take: 30,
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate user attendance stats
    const totalPresent = await prisma.attendance.count({
      where: { userId: id, status: { in: ['PRESENT', 'LATE'] } },
    });
    const totalLate = await prisma.attendance.count({
      where: { userId: id, status: 'LATE' },
    });
    const totalRecorded = await prisma.attendance.count({
      where: { userId: id },
    });

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
        createdAt: user.createdAt,
        hasFaceRegistered: !!user.faceProfile,
        faceRegisteredAt: user.faceProfile?.registeredAt || null,
        facePreview: user.faceProfile?.facePreview || null,
        stats: {
          totalPresent,
          totalLate,
          totalRecorded,
        },
        recentAttendance: user.attendances,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user details.' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { fullName, email, password, studentId, department, className, role } = req.body;

    if (!fullName || !email || !password || !studentId || !department || !className) {
      res.status(400).json({ error: 'All fields (name, email, password, ID, department, class) are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedStudentId = studentId.trim();

    // Check existing email
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      res.status(400).json({ error: 'A user with this email address already exists.' });
      return;
    }

    // Check existing student ID
    const existingId = await prisma.user.findUnique({ where: { studentId: normalizedStudentId } });
    if (existingId) {
      res.status(400).json({ error: 'A user with this Student/Employee ID already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        studentId: normalizedStudentId,
        department: department.trim(),
        className: className.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        isActive: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED',
        performedBy: req.user?.fullName || 'ADMIN',
        userId: user.id,
        details: JSON.stringify({
          fullName: user.fullName,
          studentId: user.studentId,
          email: user.email,
          role: user.role,
        }),
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        className: user.className,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { fullName, email, studentId, department, className, role, isActive, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (department) updateData.department = department.trim();
    if (className) updateData.className = className.trim();
    if (role && (role === 'ADMIN' || role === 'USER')) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    if (email && email.toLowerCase().trim() !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (emailConflict) {
        res.status(400).json({ error: 'Email is already in use by another account.' });
        return;
      }
      updateData.email = email.toLowerCase().trim();
    }

    if (studentId && studentId.trim() !== existingUser.studentId) {
      const idConflict = await prisma.user.findUnique({
        where: { studentId: studentId.trim() },
      });
      if (idConflict) {
        res.status(400).json({ error: 'Student/Employee ID is already in use.' });
        return;
      }
      updateData.studentId = studentId.trim();
    }

    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        performedBy: req.user?.fullName || 'ADMIN',
        userId: updatedUser.id,
        details: JSON.stringify({ fieldsUpdated: Object.keys(updateData) }),
      },
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        studentId: updatedUser.studentId,
        department: updatedUser.department,
        className: updatedUser.className,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({ error: 'You cannot delete your own account while logged in.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'USER_DELETED',
        performedBy: req.user?.fullName || 'ADMIN',
        details: JSON.stringify({
          deletedUserId: id,
          fullName: existingUser.fullName,
          studentId: existingUser.studentId,
        }),
      },
    });

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (req.user?.id === id && user.isActive) {
      res.status(400).json({ error: 'You cannot deactivate your own account.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.json({
      message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ error: 'Failed to change user status.' });
  }
}

export async function getDepartments(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: { department: true, className: true },
      distinct: ['department', 'className'],
    });

    const departments = Array.from(new Set(users.map((u) => u.department).filter(Boolean))).sort();
    const classes = Array.from(new Set(users.map((u) => u.className).filter(Boolean))).sort();

    res.json({ departments, classes });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
}

