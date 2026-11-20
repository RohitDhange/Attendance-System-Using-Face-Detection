import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ScanFace,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../../services/api';
import { DashboardMetrics, AttendanceTrendDay, AttendanceRecord } from '../../types';
import { formatDate, formatTime, getStatusBadgeClass } from '../../utils/formatters';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<AttendanceTrendDay[]>([]);
  const [todayAttendances, setTodayAttendances] = useState<AttendanceRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{
        metrics: DashboardMetrics;
        last7DaysTrend: AttendanceTrendDay[];
        todayAttendances: AttendanceRecord[];
        recentActivity: AttendanceRecord[];
      }>('/reports/overview');

      setMetrics(data.metrics);
      setTrendData(data.last7DaysTrend);
      setTodayAttendances(data.todayAttendances);
      setRecentActivity(data.recentActivity);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 mt-2">Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrator Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time biometric verifications and daily attendance statistics
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/users/add')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
          <button
            onClick={() => navigate('/admin/face-registration')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors"
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Register Face</span>
          </button>
          <button
            onClick={() => navigate('/admin/attendance')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Attendance Logs</span>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Reports</span>
          </button>
          <button
            onClick={fetchDashboardData}
            title="Refresh statistics"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Users */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics?.totalUsers ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {metrics?.totalStudents ?? 0} active students enrolled
            </p>
          </div>
        </div>

        {/* Card 2: Faces Registered */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faces Registered</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ScanFace className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics?.totalFacesRegistered ?? 0}
            </div>
            <p className="text-[11px] text-purple-600 font-medium mt-0.5">
              {metrics?.totalStudents
                ? `${Math.round(((metrics.totalFacesRegistered || 0) / metrics.totalStudents) * 100)}% biometric coverage`
                : '100%'}
            </p>
          </div>
        </div>

        {/* Card 3: Today's Present */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Present</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics?.todayPresent ?? 0}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              +{metrics?.todayLate ?? 0} marked late
            </p>
          </div>
        </div>

        {/* Card 4: Today's Absent */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Absent</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics?.todayAbsent ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Pending check-in</p>
          </div>
        </div>

        {/* Card 5: Attendance Rate */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics?.attendancePercentage ?? 0}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${metrics?.attendancePercentage ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart on Left, Recent Activity on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Attendance Trends (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500">
                Daily present rate and student turnout trajectory
              </p>
            </div>
            <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
              Live biometrics
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return `${parts[1]}/${parts[2]}`;
                  }}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present Students"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#presentGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="late"
                  name="Late Students"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Activity Stream (1 Column) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Verifications</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2.5 divide-y divide-slate-100">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No attendance verifications recorded yet today.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {item.userName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {item.userName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.studentId} • {item.department}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadgeClass(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatTime(item.checkInTime)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Today's Attendance Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's Attendance Log</h3>
            <p className="text-xs text-slate-500">
              Biometric check-ins captured for today ({metrics?.todayAttended ?? 0} attendees)
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/attendance')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {todayAttendances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No students have marked attendance today yet.
                  </td>
                </tr>
              ) : (
                todayAttendances.slice(0, 8).map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {record.userName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {record.studentId}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{record.department}</td>
                    <td className="py-3 px-4 text-slate-600">{formatTime(record.checkInTime)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadgeClass(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {record.confidence ? `${record.confidence}%` : 'Verified'}
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

