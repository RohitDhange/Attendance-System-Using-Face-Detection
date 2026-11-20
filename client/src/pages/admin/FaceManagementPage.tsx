import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fingerprint,
  ScanFace,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2,
  GraduationCap,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';

interface FaceItem {
  userId: string;
  fullName: string;
  studentId: string;
  email: string;
  department: string;
  className: string;
  registeredAt: string;
  updatedAt: string;
  facePreview?: string | null;
}

export const FaceManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [faces, setFaces] = useState<FaceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [departments, setDepartments] = useState<string[]>([]);
  const [faceToDelete, setFaceToDelete] = useState<FaceItem | null>(null);

  const fetchFaces = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams({
        search,
        department: selectedDept,
      });
      const data = await api.get<{ faces: FaceItem[] }>(`/face/list?${query.toString()}`);
      setFaces(data.faces);
    } catch (err: any) {
      showNotification('error', 'Failed to load face database', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaces();
  }, [search, selectedDept]);

  useEffect(() => {
    api
      .get<{ departments: string[] }>('/users/departments')
      .then((res) => setDepartments(res.departments))
      .catch(() => {});
  }, []);

  const handleDeleteFace = async () => {
    if (!faceToDelete) return;
    try {
      await api.delete(`/face/${faceToDelete.userId}`);
      showNotification(
        'success',
        'Face Profile Deleted',
        `Biometric signature removed for ${faceToDelete.fullName}.`
      );
      setFaceToDelete(null);
      fetchFaces();
    } catch (err: any) {
      showNotification('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Biometric Face Database</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {faces.length} Registered
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit, re-enroll, or delete AES-256 encrypted biometric signatures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/face-registration')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <ScanFace className="w-4 h-4" />
            <span>Register New Face</span>
          </button>
          <button
            onClick={fetchFaces}
            title="Refresh list"
            className="p-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 w-full sm:w-auto focus:ring-2 focus:ring-indigo-600"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Registered Face Cards */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
          <span>Querying biometric vault...</span>
        </div>
      ) : faces.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-subtle space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Fingerprint className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Face Profiles Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No registered biometric profiles matched your criteria. You can register new student faces at any time.
          </p>
          <button
            onClick={() => navigate('/admin/face-registration')}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Launch Face Registration</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {faces.map((item) => (
            <div
              key={item.userId}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header with thumbnail & badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="relative">
                    {item.facePreview ? (
                      <img
                        src={item.facePreview}
                        alt={item.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                        {item.fullName.charAt(0)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Encrypted</span>
                    </span>
                  </div>
                </div>

                {/* Name & ID */}
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {item.fullName}
                </h4>
                <p className="text-[11px] font-mono font-medium text-slate-500">
                  {item.studentId}
                </p>

                {/* Department Details */}
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.className}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>Registered {formatDate(item.registeredAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons at bottom */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() =>
                    navigate(`/admin/face-registration?userId=${item.userId}`)
                  }
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>Update Face</span>
                </button>
                <button
                  onClick={() => setFaceToDelete(item)}
                  title="Delete face registration"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Face Confirmation Dialog */}
      {faceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-elevated border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Biometric Profile?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete the registered face profile for <strong>{faceToDelete.fullName}</strong> ({faceToDelete.studentId})? The user will need to re-enroll their face before they can mark biometric attendance.
            </p>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setFaceToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFace}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

