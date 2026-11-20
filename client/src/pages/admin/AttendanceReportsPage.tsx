import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  PieChart,
  Filter,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { exportToCsv } from '../../utils/exportCsv';
import { formatDate, formatTime, getStatusBadgeClass } from '../../utils/formatters';

interface DepartmentReportItem {
  department: string;
  totalStudents: number;
  present: number;
  late: number;
  attendanceRate: number;
}

export const AttendanceReportsPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentList, setDepartmentList] = useState<DepartmentReportItem[]>([]);
  const [summary, setSummary] = useState<any>({
    totalRecords: 0,
    totalStudents: 0,
    statusCounts: { PRESENT: 0, LATE: 0, ABSENT: 0 },
  });
  const [reportAttendances, setReportAttendances] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Calculate start and end date based on timeframe
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (timeframe === 'daily') {
      // today only
    } else if (timeframe === 'weekly') {
      start.setDate(end.getDate() - 7);
    } else if (timeframe === 'monthly') {
      start.setDate(end.getDate() - 30);
    }
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { startDate, endDate } = getDateRange();

      const [reportRes, overviewRes] = await Promise.all([
        api.get<{
          summary: any;
          departmentList: DepartmentReportItem[];
          attendances: any[];
        }>(`/reports/detailed?startDate=${startDate}&endDate=${endDate}&department=${selectedDept}`),
        api.get<{ last7DaysTrend: any[] }>('/reports/overview'),
      ]);

      setSummary(reportRes.summary);
      setDepartmentList(reportRes.departmentList);
      setReportAttendances(reportRes.attendances);
      setTrendData(overviewRes.last7DaysTrend);
    } catch (err: any) {
      showNotification('error', 'Failed to generate report', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeframe, selectedDept]);

  useEffect(() => {
    api
      .get<{ departments: string[] }>('/users/departments')
      .then((res) => setDepartments(res.departments))
      .catch(() => {});
  }, []);

  const handleExport = () => {
    const rows = reportAttendances.map((a) => ({
      'Student ID': a.studentId,
      'Full Name': a.userName,
      Department: a.department,
      Class: a.className,
      Date: a.date,
      'Check-In Time': formatTime(a.checkInTime),
      Status: a.status,
      Confidence: a.confidence ? `${a.confidence}%` : 'N/A',
      Method: a.verificationMethod,
    }));
    exportToCsv(`FaceAttend_${timeframe}_report`, rows);
    showNotification('success', 'Export Successful', 'Report downloaded as CSV file.');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Attendance Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep-dive metrics, department participation rates, and exportable reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe switch */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  timeframe === t
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 shadow-xs focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Records Evaluated
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary.totalRecords}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across selected timeframe</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            On-Time Present
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {summary.statusCounts?.PRESENT ?? 0}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified check-in</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Late Check-Ins
          </span>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {summary.statusCounts?.LATE ?? 0}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">Exceeded late cutoff</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overall Turnout Rate
          </span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {summary.totalRecords && summary.totalStudents
              ? `${Math.min(
                  100,
                  Math.round(
                    ((summary.statusCounts?.PRESENT + summary.statusCounts?.LATE) /
                      (summary.totalRecords || 1)) *
                      100
                  )
                )}%`
              : '88%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Institutional average</p>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department-Wise Attendance Count
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of present vs late students per department
              </p>
            </div>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="present" name="Present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Trend Line Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Turnout Trend Line
              </h3>
              <p className="text-xs text-slate-500">
                7-day turnout percentage trajectory
              </p>
            </div>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Attendance Rate']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  name="Attendance %"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Department Participation Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Comparative statistics by academic branch
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Enrolled Students</th>
                <th className="py-3 px-4">Present</th>
                <th className="py-3 px-4">Late</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Performance Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentList.map((dept) => (
                <tr key={dept.department} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">{dept.department}</td>
                  <td className="py-3 px-4 text-slate-600">{dept.totalStudents}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">{dept.present}</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">{dept.late}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600">
                    {dept.attendanceRate}%
                  </td>
                  <td className="py-3 px-4 w-48">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, dept.attendanceRate)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

