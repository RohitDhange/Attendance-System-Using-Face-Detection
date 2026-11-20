import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Lock,
  Mail,
  Building2,
  GraduationCap,
  Hash,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { formatDate } from '../../utils/formatters';

export const UserProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('error', 'Mismatch', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('error', 'Too Short', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await api.post('/auth/update-password', {
        currentPassword,
        newPassword,
      });

      showNotification('success', 'Security Updated', 'Your password has been changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showNotification('error', 'Password Update Failed', err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          User Profile & Biometric Status
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details, login credentials, and view registered face status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card (Left Column) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {user?.facePreview ? (
              <img
                src={user.facePreview}
                alt={user.fullName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-600 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl border border-indigo-100">
                {user?.fullName?.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">{user?.fullName}</h3>
            <p className="text-xs font-mono font-medium text-slate-500">{user?.studentId}</p>
            <span className="mt-2 inline-block px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {user?.role === 'ADMIN' ? 'System Administrator' : 'Enrolled Student'}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 text-left text-xs space-y-2.5 text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.className}</span>
            </div>
          </div>
        </div>

        {/* Biometrics & Security (Right 2 Columns) */}
        <div className="md:col-span-2 space-y-6">
          {/* Biometric Status Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Biometric Face Enrollment</span>
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Active & Enrolled
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your biometric face profile is registered and securely encrypted in the institutional vault using <strong>AES-256-GCM</strong>. Face vectors are mathematically irreversibly mapped to 128 floating-point coordinates.
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Enrolled: {user?.faceRegisteredAt ? formatDate(user.faceRegisteredAt) : 'Active'}
              </span>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Change Account Password</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Update your account password for secure web portal access
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

