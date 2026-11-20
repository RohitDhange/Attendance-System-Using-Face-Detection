import React, { useEffect, useState } from 'react';
import {
  Settings,
  Clock,
  Sliders,
  Building2,
  ShieldCheck,
  Save,
  RefreshCw,
  History,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { AuditLogItem, SystemSettings } from '../../types';
import { formatDate, formatTime } from '../../utils/formatters';

export const SettingsPage: React.FC = () => {
  const { showNotification } = useNotification();

  const [settings, setSettings] = useState<SystemSettings>({
    lateThresholdTime: '09:30',
    matchingThreshold: '0.50',
    orgName: 'Apex Institute of Science & Technology',
    allowCameraFlip: 'true',
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchSettingsAndLogs = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        api.get<{ settings: SystemSettings }>('/settings'),
        api.get<{ logs: AuditLogItem[] }>('/settings/audit-logs'),
      ]);

      setSettings(settingsRes.settings);
      setAuditLogs(logsRes.logs);
    } catch (err: any) {
      showNotification('error', 'Error loading settings', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/settings', { settings });
      showNotification('success', 'Settings Saved', 'System rules updated successfully.');
      fetchSettingsAndLogs();
    } catch (err: any) {
      showNotification('error', 'Failed to save', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>System Settings & Attendance Rules</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure check-in thresholds, biometric confidence tolerance, and review security audit logs
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setting 1: Late Cutoff Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Late Check-In Threshold (24-Hour Time)</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Check-ins after this time are marked as <strong>LATE</strong> instead of PRESENT.
              </p>
              <input
                type="time"
                required
                value={settings.lateThresholdTime}
                onChange={(e) =>
                  setSettings({ ...settings, lateThresholdTime: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>

            {/* Setting 2: Matching Distance Threshold */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Max Euclidean Distance Threshold: {settings.matchingThreshold}</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Recommended <strong>0.50</strong>. Lower is stricter (fewer false positives); higher is more forgiving.
              </p>
              <input
                type="range"
                min="0.30"
                max="0.65"
                step="0.02"
                value={settings.matchingThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, matchingThreshold: e.target.value })
                }
                className="w-full accent-indigo-600 cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.30 (Ultra Strict)</span>
                <span>0.50 (Balanced)</span>
                <span>0.65 (Lenient)</span>
              </div>
            </div>

            {/* Setting 3: Organization Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Institution / Organization Name</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Appears on attendance reports, export certificates, and email notices.
              </p>
              <input
                type="text"
                required
                value={settings.orgName}
                onChange={(e) =>
                  setSettings({ ...settings, orgName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>

            {/* Setting 4: Camera Flip Allowed */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Allow Camera Switching</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Allow mobile or tablet users to toggle between front selfie and rear cameras.
              </p>
              <select
                value={settings.allowCameraFlip}
                onChange={(e) =>
                  setSettings({ ...settings, allowCameraFlip: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600"
              >
                <option value="true">Enabled (Allow camera toggle)</option>
                <option value="false">Disabled (Enforce default webcam)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply & Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security Audit Log</h3>
              <p className="text-xs text-slate-500">
                Immutable record of administrative actions, user additions, and biometric updates
              </p>
            </div>
          </div>
          <button
            onClick={fetchSettingsAndLogs}
            title="Refresh logs"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No audit entries recorded.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-600">by {log.performedBy}</span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-lg">
                      {log.details}
                    </p>
                  )}
                </div>
                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <p>{formatDate(log.createdAt)}</p>
                  <p>{formatTime(log.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

