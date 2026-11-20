import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const getOffsetDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function main() {
  console.log('🌱 Starting FaceAttend database seeding...');

  // 1. Seed System Settings
  const settings = [
    { key: 'lateThresholdTime', value: '09:30', description: 'Check-in time after which attendance is marked LATE' },
    { key: 'matchingThreshold', value: '0.50', description: 'Max Euclidean distance threshold for face match' },
    { key: 'orgName', value: 'Apex Institute of Science & Technology', description: 'College / Institute Name' },
    { key: 'allowCameraFlip', value: 'true', description: 'Allow front/back camera toggling' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: s,
    });
  }
  console.log('✅ System settings seeded.');

  // 2. Passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);

  // 3. Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@faceattend.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
    create: {
      fullName: 'System Administrator',
      email: 'admin@faceattend.com',
      passwordHash: adminPasswordHash,
      studentId: 'ADM-1001',
      department: 'Administration',
      className: 'Staff',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 4. Seed Sample Students
  const studentsData = [
    {
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@faceattend.com',
      studentId: 'CS-2024-001',
      department: 'Computer Science',
      className: 'CS-Batch-A',
    },
    {
      fullName: 'Priya Patel',
      email: 'priya.patel@faceattend.com',
      studentId: 'CS-2024-002',
      department: 'Computer Science',
      className: 'CS-Batch-A',
    },
    {
      fullName: 'Rohan Mehta',
      email: 'rohan.mehta@faceattend.com',
      studentId: 'CS-2024-003',
      department: 'Computer Science',
      className: 'CS-Batch-B',
    },
    {
      fullName: 'Ananya Deshmukh',
      email: 'ananya.d@faceattend.com',
      studentId: 'EC-2024-010',
      department: 'Electronics & Comm.',
      className: 'EC-Batch-A',
    },
    {
      fullName: 'Vikram Joshi',
      email: 'vikram.j@faceattend.com',
      studentId: 'EC-2024-011',
      department: 'Electronics & Comm.',
      className: 'EC-Batch-B',
    },
    {
      fullName: 'Sneha Kulkarni',
      email: 'sneha.k@faceattend.com',
      studentId: 'ME-2024-025',
      department: 'Mechanical Engg.',
      className: 'ME-Batch-A',
    },
    {
      fullName: 'Rahul Verma',
      email: 'rahul.v@faceattend.com',
      studentId: 'IT-2024-033',
      department: 'Information Technology',
      className: 'IT-Batch-A',
    },
  ];

  const createdStudents = [];
  for (const st of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: st.email },
      update: {
        passwordHash: studentPasswordHash,
      },
      create: {
        fullName: st.fullName,
        email: st.email,
        passwordHash: studentPasswordHash,
        studentId: st.studentId,
        department: st.department,
        className: st.className,
        role: 'USER',
        isActive: true,
      },
    });
    createdStudents.push(user);
  }
  console.log(`✅ ${createdStudents.length} sample students seeded.`);

  // 5. Seed Attendance History for realistic chart statistics
  // Seed past 5 days
  for (let offset = 4; offset >= 1; offset--) {
    const dateStr = getOffsetDateString(offset);

    for (let i = 0; i < createdStudents.length; i++) {
      const student = createdStudents[i];
      // Randomly assign present or late or absent
      const isLate = (i + offset) % 4 === 0;
      const isAbsent = (i + offset) % 5 === 0;

      if (!isAbsent) {
        const timeStr = isLate ? '09:42:15' : '09:12:30';
        const checkIn = new Date(`${dateStr}T${timeStr}`);

        await prisma.attendance.upsert({
          where: {
            user_daily_attendance: {
              userId: student.id,
              attendanceDate: dateStr,
            },
          },
          create: {
            userId: student.id,
            attendanceDate: dateStr,
            checkInTime: checkIn,
            status: isLate ? 'LATE' : 'PRESENT',
            verificationMethod: 'FACE_RECOGNITION',
            confidence: 93.5 - (i * 1.5),
            notes: 'System verified biometric scan',
          },
          update: {},
        });
      }
    }
  }

  // Seed 2 records for today so today's stats show active presence
  const todayStr = getOffsetDateString(0);
  if (createdStudents.length >= 2) {
    await prisma.attendance.upsert({
      where: {
        user_daily_attendance: {
          userId: createdStudents[0].id,
          attendanceDate: todayStr,
        },
      },
      create: {
        userId: createdStudents[0].id,
        attendanceDate: todayStr,
        checkInTime: new Date(`${todayStr}T09:08:22`),
        status: 'PRESENT',
        verificationMethod: 'FACE_RECOGNITION',
        confidence: 96.2,
        notes: 'Smart face attendance verified',
      },
      update: {},
    });

    await prisma.attendance.upsert({
      where: {
        user_daily_attendance: {
          userId: createdStudents[1].id,
          attendanceDate: todayStr,
        },
      },
      create: {
        userId: createdStudents[1].id,
        attendanceDate: todayStr,
        checkInTime: new Date(`${todayStr}T09:34:10`),
        status: 'LATE',
        verificationMethod: 'FACE_RECOGNITION',
        confidence: 94.8,
        notes: 'Smart face attendance verified (late check-in)',
      },
      update: {},
    });
  }

  console.log('✅ Historical attendance records seeded.');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

