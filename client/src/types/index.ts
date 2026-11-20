export type Role = 'ADMIN' | 'USER';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export type VerificationMethod = 'FACE_RECOGNITION' | 'MANUAL_ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  className: string;
  role: Role;
  isActive: boolean;
  avatar?: string | null;
  createdAt: string;
  hasFaceRegistered?: boolean;
  faceRegisteredAt?: string | null;
  facePreview?: string | null;
  todayAttendance?: {
    status: AttendanceStatus;
    checkInTime: string;
  } | null;
}

export interface FaceProfile {
  id: string;
  userId: string;
  registeredAt: string;
  updatedAt: string;
  facePreview?: string | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  studentId: string;
  email?: string;
  department: string;
  className: string;
  date: string;
  checkInTime: string;
  status: AttendanceStatus;
  confidence?: number | null;
  verificationMethod: VerificationMethod;
  notes?: string | null;
}

export interface DashboardMetrics {
  totalUsers: number;
  totalStudents: number;
  totalFacesRegistered: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  todayAttended: number;
  attendancePercentage: number;
}

export interface AttendanceTrendDay {
  date: string;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

export interface SystemSettings {
  lateThresholdTime: string;
  matchingThreshold: string;
  orgName: string;
  allowCameraFlip: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  performedBy: string;
  userId?: string | null;
  user?: {
    fullName: string;
    studentId: string;
    email: string;
  } | null;
  details?: string | null;
  createdAt: string;
}

