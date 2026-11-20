import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ScanFace,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  CalendarCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  User,
  GraduationCap,
  Building2,
  Loader2,
} from 'lucide-react';
import { FaceCameraScanner } from '../../components/face/FaceCameraScanner';
import { DetectionResult } from '../../services/faceRecognition';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatDate, formatTime, getStatusBadgeClass } from '../../utils/formatters';

export const MarkAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [alreadyMarkedData, setAlreadyMarkedData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // Check if already marked today on page mount
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ todayAttendance: any | null }>('/attendance/my-history');
        if (data.todayAttendance) {
          setAlreadyMarkedData(data.todayAttendance);
        }
      } catch (err) {
        console.warn('Could not verify existing attendance status:', err);
      }
    })();
  }, []);

  const handleFaceDetected = async (result: DetectionResult, snapshot: string) => {
    if (isVerifying || successData || alreadyMarkedData) return;

    try {
      setIsVerifying(true);
      setErrorMessage(null);
      setCapturedSnapshot(snapshot);

      const res = await api.post<{
        message: string;
        attendance: any;
      }>('/attendance/mark-face', {
        userId: user?.id,
        descriptor: result.descriptor,
      });

      // Attendance success!
      setSuccessData(res.attendance);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#6366f1', '#f59e0b'],
        });
      } catch (e) {
        // ignore in non-browser env
      }

      showNotification('success', 'Attendance Verified!', `Marked ${res.attendance.status}`);
    } catch (err: any) {
      if (err.data?.code === 'ALREADY_MARKED') {
        setAlreadyMarkedData(err.data.attendance);
      } else if (err.data?.code === 'FACE_NOT_MATCHED') {
        setErrorMessage('Face Not Recognized. Please Try Again.');
      } else if (err.data?.code === 'FACE_NOT_REGISTERED') {
        setErrorMessage('Your face is not registered in the system yet. Please contact an administrator.');
      } else {
        setErrorMessage(err.message || 'Face verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTryAgain = () => {
    setErrorMessage(null);
    setSuccessData(null);
    setCapturedSnapshot(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <ScanFace className="w-6 h-6 text-indigo-600" />
          <span>Smart Facial Attendance</span>
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Look directly at the camera. The system will recognize your face and record your attendance automatically.
        </p>
      </div>

      {/* Main Scanner Container or Results */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-elevated">
        {alreadyMarkedData ? (
          /* Already Marked State */
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <CalendarCheck className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                Already Checked In
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Your attendance has already been marked today.
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                FaceAttend enforces a single attendance check-in per user per day.
              </p>
            </div>

            {/* Attendance Details Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-semibold text-slate-800">{user?.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono font-medium text-slate-700">{user?.studentId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Check-In Time:</span>
                <span className="font-semibold text-slate-800">
                  {formatTime(alreadyMarkedData.checkInTime)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Attendance Status:</span>
                <span
                  className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${getStatusBadgeClass(
                    alreadyMarkedData.status
                  )}`}
                >
                  {alreadyMarkedData.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => navigate('/user/dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : successData ? (
          /* SUCCESS VIEW */
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                Biometric Verification Passed
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Attendance Marked Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Your check-in record has been stored and validated in the institutional database.
              </p>
            </div>

            {/* Success Details Table */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-2.5 text-xs shadow-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500">User Name:</span>
                <span className="font-bold text-slate-900 text-sm">{successData.userName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono font-medium text-slate-800">{successData.studentId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Department & Class:</span>
                <span className="text-slate-800">
                  {successData.department} ({successData.className})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-800">{formatDate(successData.date)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Check-In Time:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatTime(successData.checkInTime)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Attendance Status:</span>
                <span
                  className={`px-2.5 py-1 rounded-md font-bold text-xs border ${getStatusBadgeClass(
                    successData.status
                  )}`}
                >
                  {successData.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => navigate('/user/dashboard')}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* SCANNER ACTIVE VIEW */
          <div className="space-y-4">
            {/* Student info banner */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.fullName?.charAt(0)}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">{user?.fullName}</span>
                  <span className="text-[11px] text-slate-500 font-mono ml-2">({user?.studentId})</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Live Scan Mode
              </span>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">
                    Make sure you are facing the camera directly in good lighting.
                  </p>
                </div>
                <button
                  onClick={handleTryAgain}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Face Camera Scanner */}
            <FaceCameraScanner
              onFaceDetected={handleFaceDetected}
              isProcessing={isVerifying}
              instructionText="Hold still and look at the camera"
              autoCaptureOnDetection={false}
              showPreview={false}
            />

            <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Biometric matching performed against your encrypted 128-d profile vector.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
