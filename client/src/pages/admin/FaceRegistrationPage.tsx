import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ScanFace,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Sparkles,
  Loader2,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { FaceCameraScanner } from '../../components/face/FaceCameraScanner';
import { DetectionResult } from '../../services/faceRecognition';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { User as UserType } from '../../types';

export const FaceRegistrationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(searchParams.get('userId') || '');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [capturedResult, setCapturedResult] = useState<DetectionResult | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fetch users for selector
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ users: UserType[] }>('/users?limit=100');
        setUsers(data.users);
      } catch (err) {
        console.error('Failed to load users for registration:', err);
      }
    })();
  }, []);

  // Update selected user object when selection changes
  useEffect(() => {
    if (selectedUserId) {
      const u = users.find((user) => user.id === selectedUserId);
      if (u) {
        setSelectedUser(u);
      } else {
        // Fetch specific user
        api
          .get<{ user: UserType }>(`/users/${selectedUserId}`)
          .then((res) => setSelectedUser(res.user))
          .catch(() => setSelectedUser(null));
      }
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, users]);

  const handleFaceCaptured = (result: DetectionResult, snapshot: string) => {
    setCapturedResult(result);
    setCapturedSnapshot(snapshot);
  };

  const handleSaveFaceProfile = async () => {
    if (!selectedUserId) {
      showNotification('error', 'Select User', 'Please select a student or user first.');
      return;
    }

    if (!capturedResult) {
      showNotification('error', 'No Face Captured', 'Please capture a clear face photo before saving.');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/face/register', {
        userId: selectedUserId,
        descriptor: capturedResult.descriptor,
        facePreview: capturedSnapshot,
      });

      setIsSuccess(true);
      showNotification(
        'success',
        'Biometrics Saved',
        `Face profile registered & encrypted for ${selectedUser?.fullName}`
      );
    } catch (err: any) {
      showNotification('error', 'Registration Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCapturedResult(null);
    setCapturedSnapshot(null);
    setIsSuccess(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Biometric Face Registration</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Step-by-Step Enrollment
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Capture facial descriptors with the live camera. 128-d vectors are encrypted with AES-256 for secure recognition.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: User Selection & Instructions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* User Selector Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Select User</span>
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Choose Student / Staff:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  handleReset();
                }}
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">-- Select a User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.studentId}) - {u.hasFaceRegistered ? '✓ Registered' : 'Pending'}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {selectedUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedUser.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{selectedUser.studentId}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                  <p><strong>Dept:</strong> {selectedUser.department}</p>
                  <p><strong>Class:</strong> {selectedUser.className}</p>
                  <p className="flex items-center gap-1 pt-1">
                    <strong>Status:</strong>
                    {selectedUser.hasFaceRegistered ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Face Enrolled
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">Not Enrolled</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-subtle space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Enrollment Tips</span>
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Ensure balanced, front-facing ambient lighting.</li>
              <li>Position the face centered within the oval guide.</li>
              <li>Avoid wearing dark sunglasses or large caps.</li>
              <li>Maintain a neutral or pleasant facial expression.</li>
            </ul>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Embeddings stored in encrypted 128-float tensors.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Camera Scanner & Confirmation (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
            {!selectedUserId ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Select a User to Begin
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Please choose a student or employee from the left panel to launch the biometric camera stream.
                </p>
              </div>
            ) : isSuccess ? (
              /* Success Celebration View */
              <div className="py-12 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Registration Confirmed!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Biometric face descriptor for <strong>{selectedUser?.fullName}</strong> has been encrypted and stored. The user can now use facial recognition for instant daily attendance.
                  </p>
                </div>

                {capturedSnapshot && (
                  <div className="flex justify-center">
                    <img
                      src={capturedSnapshot}
                      alt="Registered preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      handleReset();
                      setSelectedUserId('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                  >
                    Register Another User
                  </button>
                  <button
                    onClick={() => navigate('/admin/face-management')}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    View Face Database
                  </button>
                </div>
              </div>
            ) : (
              /* Live Camera Scanner */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ScanFace className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-800">
                      Live Biometric Scanner for {selectedUser?.fullName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {selectedUser?.studentId}
                  </span>
                </div>

                <FaceCameraScanner
                  onFaceDetected={handleFaceCaptured}
                  isProcessing={isSaving}
                  instructionText="Center your face inside the viewfinder"
                  showPreview={true}
                />

                {/* Save Confirmation Button once captured */}
                {capturedResult && (
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Retake Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveFaceProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Encrypting & Storing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Save & Encrypt Biometric Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

