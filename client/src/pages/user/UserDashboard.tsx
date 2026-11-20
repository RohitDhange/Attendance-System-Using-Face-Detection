import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  CalendarCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  ScanFace,
  ShieldCheck,
  Loader2,
  Calendar,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { formatDate, formatTime, getStatusBadgeClass } from '../../utils/formatters';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [stats, setStats] = useState<{
    totalPresent: number;
    totalLate: number;
    totalAttended: number;
    totalDaysRecorded: number;
    attendancePercentage: number;
  }>({
    totalPresent: 0,
    totalLate: 0,
    totalAttended: 0,
    totalDaysRecorded: 0,
    attendancePercentage: 0,
  });
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{
        todayAttendance: any | null;
        stats: any;
        history: AttendanceRecord[];
      }>('/attendance/my-history');

      setTodayAttendance(data.todayAttendance);
      setStats(data.stats);
      setHistory(data.history);
    } catch (err) {
      console.error('Failed to load user attendance history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const isTodayMarked = !!todayAttendance;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-brand-600 rounded-3xl p-6 md:p-8 text-white shadow-elevated relative overflow-hidden">
        {/* Soft decorative glow circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-indigo-900/30 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md border border-white/20 text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart Biometric Portal</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName}!
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-100/90 pt-1">
              <span className="font-mono bg-white/15 px-2 py-0.5 rounded">
                ID: {user?.studentId}
              </span>
              <span>•</span>
              <span>{user?.department}</span>
              <span>•</span>
              <span>{user?.className}</span>
            </div>
          </div>

          {/* Quick Mark Attendance Big Button */}
          <div className="shrink-0 flex flex-col items-center sm:items-end">
            {isTodayMarked ? (
              <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-center sm:text-right">
                <div className="flex items-center gap-2 justify-center sm:justify-end text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Attendance Recorded Today</span>
                </div>
                <p className="text-xs text-indigo-100 mt-1">
                  Checked in at <strong>{formatTime(todayAttendance.checkInTime)}</strong> (
                  {todayAttendance.status})
                </p>
              </div>
            ) : (
              <button
                onClick={() => navigate('/user/mark-attendance')}
                className="group flex items-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 text-indigo-700 hover:text-indigo-800 rounded-2xl shadow-elevated font-bold text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                  <ScanFace className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-left">
                  <span className="block leading-tight text-slate-900 font-extrabold">
                    Mark My Attendance
                  </span>
                  <span className="block text-xs font-medium text-indigo-600">
                    1-Click Live Face Scan
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Status */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Status</span>
            <div
              className={`p-2 rounded-xl ${
                isTodayMarked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {isTodayMarked ? (
                <span className="text-emerald-600">{todayAttendance.status}</span>
              ) : (
                <span className="text-slate-400">Not Marked</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isTodayMarked
                ? `At ${formatTime(todayAttendance.checkInTime)}`
                : 'Pending daily facial verification'}
            </p>
          </div>
        </div>

        {/* Total Present Days */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Present Days</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalPresent}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              +{stats.totalLate} late attendance days
            </p>
          </div>
        </div>

        {/* Total Absent Days */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Score</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.attendancePercentage}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${stats.attendancePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Face Profile Status */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Face Profile</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Biometrics Active</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">AES-256 Vault Verified</p>
          </div>
        </div>
      </div>

      {/* Recent Personal Attendance History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Attendance History</h3>
            <p className="text-xs text-slate-500">
              Your logged check-in entries and verification records
            </p>
          </div>
          <button
            onClick={() => navigate('/user/history')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View Complete History →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading your records...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No attendance records logged yet.
                  </td>
                </tr>
              ) : (
                history.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {formatTime(item.checkInTime)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.verificationMethod === 'FACE_RECOGNITION'
                        ? 'Facial Biometrics'
                        : 'Manual Admin'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.confidence ? `${item.confidence}%` : 'Verified'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

