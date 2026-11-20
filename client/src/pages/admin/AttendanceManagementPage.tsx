import React, { useEffect, useState, useCallback } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  RefreshCw,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { AttendanceRecord, AttendanceStatus, User as UserType } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatTime, getStatusBadgeClass } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportCsv';

export const AttendanceManagementPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Manual Mark / Edit Modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualFormData, setManualFormData] = useState({
    userId: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'PRESENT',
    notes: 'Admin manual verification',
  });

  const fetchAttendances = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search,
        department: selectedDept,
        status: selectedStatus === 'ALL' ? '' : selectedStatus,
        date: selectedDate,
      });

      const data = await api.get<{
        attendances: AttendanceRecord[];
        pagination: { total: number; totalPages: number };
      }>(`/attendance?${params.toString()}`);

      setAttendances(data.attendances);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err: any) {
      showNotification('error', 'Error loading attendance', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedDept, selectedStatus, selectedDate, showNotification]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  useEffect(() => {
    api
      .get<{ departments: string[] }>('/users/departments')
      .then((res) => setDepartments(res.departments))
      .catch(() => {});

    api
      .get<{ users: UserType[] }>('/users?limit=100')
      .then((res) => setUsersList(res.users))
      .catch(() => {});
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFormData.userId || !manualFormData.date) {
      showNotification('error', 'Missing Fields', 'Please select a student and date.');
      return;
    }

    try {
      await api.post('/attendance/manual', manualFormData);
      showNotification('success', 'Attendance Saved', 'Manual attendance record updated successfully.');
      setShowManualModal(false);
      fetchAttendances();
    } catch (err: any) {
      showNotification('error', 'Manual Entry Failed', err.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await api.delete(`/attendance/${id}`);
      showNotification('success', 'Record Deleted', 'Attendance record removed.');
      fetchAttendances();
    } catch (err: any) {
      showNotification('error', 'Delete Failed', err.message);
    }
  };

  const handleExport = () => {
    const exportRows = attendances.map((a) => ({
      'Student ID': a.studentId,
      'Full Name': a.userName,
      Department: a.department,
      Class: a.className,
      Date: a.date,
      'Check-In Time': formatTime(a.checkInTime),
      Status: a.status,
      'Confidence %': a.confidence ? `${a.confidence}%` : 'N/A',
      'Verification Method': a.verificationMethod,
      Notes: a.notes || '',
    }));
    exportToCsv('attendance_records', exportRows);
    showNotification('success', 'Export Complete', `${attendances.length} records exported to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Attendance Management</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalRecords} Total Logs
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit daily check-ins, filter records, or manually override attendance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Override / Mark</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchAttendances}
            title="Refresh logs"
            className="p-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by student name, ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
        </div>

        {/* Date, Department, Status dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Specific Date picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-600"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="ml-1 text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Department & Class</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Biometric Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading attendance logs...</span>
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                attendances.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Student name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{rec.userName}</div>
                      <div className="text-[11px] text-slate-500">{rec.email}</div>
                    </td>

                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {rec.studentId}
                    </td>

                    {/* Dept */}
                    <td className="py-3 px-4 text-slate-600">
                      <div>{rec.department}</div>
                      <div className="text-[10px] text-slate-400">{rec.className}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {formatDate(rec.date)}
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-slate-600">
                      {formatTime(rec.checkInTime)}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusBadgeClass(
                          rec.status
                        )}`}
                      >
                        {rec.status}
                      </span>
                    </td>

                    {/* Method & Confidence */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-700">
                          {rec.verificationMethod === 'FACE_RECOGNITION'
                            ? 'Face AI Scan'
                            : 'Manual Override'}
                        </span>
                        {rec.confidence && (
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {rec.confidence}%
                          </span>
                        )}
                      </div>
                      {rec.notes && (
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{rec.notes}</p>
                      )}
                    </td>

                    {/* Delete action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        title="Delete attendance record"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalRecords} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-elevated border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Manual Attendance Override
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Manually mark or adjust a student's attendance record
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={manualFormData.userId}
                  onChange={(e) =>
                    setManualFormData({ ...manualFormData, userId: e.target.value })
                  }
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">-- Choose a student --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.studentId}) - {u.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={manualFormData.date}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, date: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={manualFormData.status}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, status: e.target.value })
                    }
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical leave approved by HOD"
                  value={manualFormData.notes}
                  onChange={(e) =>
                    setManualFormData({ ...manualFormData, notes: e.target.value })
                  }
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

