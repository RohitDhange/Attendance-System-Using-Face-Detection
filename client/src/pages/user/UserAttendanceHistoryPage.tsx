import React, { useEffect, useState } from 'react';
import {
  History,
  CalendarCheck,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { AttendanceRecord } from '../../types';
import { formatDate, formatTime, getStatusBadgeClass } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';
import { useNotification } from '../../context/NotificationContext';

export const UserAttendanceHistoryPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<any>({
    totalPresent: 0,
    totalLate: 0,
    totalAttended: 0,
    totalDaysRecorded: 0,
    attendancePercentage: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchDate, setSearchDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await api.get<{
          history: AttendanceRecord[];
          stats: any;
        }>('/attendance/my-history');

        setHistory(data.history);
        setStats(data.stats);
      } catch (err: any) {
        showNotification('error', 'History Error', err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [showNotification]);

  const filteredHistory = history.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchDate && !item.date.includes(searchDate)) return false;
    return true;
  });

  const handleExport = () => {
    const rows = filteredHistory.map((item) => ({
      Date: item.date,
      'Check-In Time': formatTime(item.checkInTime),
      Status: item.status,
      Confidence: item.confidence ? `${item.confidence}%` : 'Verified',
      Method: item.verificationMethod,
    }));
    exportToCsv('my_attendance_history', rows);
    showNotification('success', 'Exported', 'Your attendance record has been downloaded as CSV.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>My Attendance Records</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View your complete historical check-in timeline and biometric logs
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export My History (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Sessions Attended
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.totalAttended} / {stats.totalDaysRecorded}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Logged attendance entries</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Attendance Rating
          </span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {stats.attendancePercentage}%
          </div>
          <p className="text-[11px] text-indigo-600 font-medium mt-0.5">Institutional standing</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Punctuality Ratio
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.totalPresent} on-time
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
            {stats.totalLate} late entries recorded
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-700">Filter Date:</label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-600"
          />
          {searchDate && (
            <button
              onClick={() => setSearchDate('')}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present Only</option>
            <option value="LATE">Late Only</option>
            <option value="ABSENT">Absent Only</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verification Method</th>
                <th className="py-3 px-4">Biometric Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading timeline...</span>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No records found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
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
                        ? 'Facial Biometric Scan'
                        : 'Manual Admin Record'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.confidence ? `${item.confidence}% confidence` : 'Verified'}
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

