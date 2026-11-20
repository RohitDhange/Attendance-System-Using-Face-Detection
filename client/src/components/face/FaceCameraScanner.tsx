import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ScanFace,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  loadFaceApiModels,
  detectFace,
  drawBoundingBox,
  captureFaceSnapshot,
  DetectionResult,
} from '../../services/faceRecognition';

interface FaceCameraScannerProps {
  onFaceDetected?: (result: DetectionResult, snapshot: string) => void;
  isProcessing?: boolean;
  instructionText?: string;
  autoCaptureOnDetection?: boolean;
  showPreview?: boolean;
}

export const FaceCameraScanner: React.FC<FaceCameraScannerProps> = ({
  onFaceDetected,
  isProcessing = false,
  instructionText,
  autoCaptureOnDetection = false,
  showPreview = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(true);
  const [modelStatus, setModelStatus] = useState<string>('Initializing AI engine...');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceInFrame, setIsFaceInFrame] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Position your face inside the frame');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasMultipleFaces, setHasMultipleFaces] = useState<boolean>(false);

  // 1. Initialize Face-API Models
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingModels(true);
        await loadFaceApiModels((msg) => {
          if (mounted) setModelStatus(msg);
        });
        if (mounted) {
          setIsLoadingModels(false);
          setModelStatus('Models ready');
        }
      } catch (err: any) {
        if (mounted) {
          setCameraError(err.message || 'Failed to initialize face recognition engine.');
          setIsLoadingModels(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Start / Stop Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Webcam access was denied. Please allow camera permissions in your browser address bar to proceed.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam was detected on this device. Please connect a camera.');
      } else {
        setCameraError('Unable to open camera: ' + (err.message || 'Unknown camera error'));
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isLoadingModels && !cameraError) {
      startCamera();
    }
    return () => stopCamera();
  }, [isLoadingModels, startCamera, stopCamera]);

  // 3. Real-time Detection Loop
  useEffect(() => {
    if (isLoadingModels || isProcessing) return;

    let scanTimer: number;

    const runDetection = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !canvasRef.current) {
        return;
      }

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const result = await detectFace(video);

        if (result) {
          setIsFaceInFrame(true);
          setHasMultipleFaces(false);
          setStatusMessage('Face detected! Hold still...');

          drawBoundingBox(
            canvas,
            result.box,
            video.videoWidth,
            video.videoHeight,
            `Face Verified (${Math.round(result.score * 100)}%)`,
            true
          );

          if (autoCaptureOnDetection) {
            const snapshot = captureFaceSnapshot(video, result.box);
            setCapturedSnapshot(snapshot);
            if (onFaceDetected) {
              onFaceDetected(result, snapshot);
            }
          }
        } else {
          setIsFaceInFrame(false);
          setStatusMessage(instructionText || 'Position your face inside the frame');
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (err) {
        console.warn('Face detection frame error:', err);
      }
    };

    scanTimer = window.setInterval(runDetection, 250);
    intervalRef.current = scanTimer;

    return () => {
      window.clearInterval(scanTimer);
    };
  }, [isLoadingModels, isProcessing, autoCaptureOnDetection, instructionText, onFaceDetected]);

  // Manual Capture button handler
  const handleManualCapture = async () => {
    if (!videoRef.current || !onFaceDetected) return;
    try {
      const video = videoRef.current;
      const result = await detectFace(video);

      if (!result) {
        setStatusMessage('No face detected. Please ensure your face is well lit and centered.');
        return;
      }

      const snapshot = captureFaceSnapshot(video, result.box);
      setCapturedSnapshot(snapshot);
      onFaceDetected(result, snapshot);
    } catch (err: any) {
      console.error('Manual capture failed:', err);
    }
  };

  const handleRetake = () => {
    setCapturedSnapshot(null);
    setIsFaceInFrame(false);
    setStatusMessage('Position your face inside the frame');
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Camera Frame Box */}
      <div className="relative w-full aspect-4/3 bg-slate-900 rounded-2xl overflow-hidden shadow-elevated border border-slate-700 flex items-center justify-center">
        {/* Loading Models State */}
        {isLoadingModels && (
          <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
            <h4 className="font-semibold text-sm">Preparing Biometric AI</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">{modelStatus}</p>
          </div>
        )}

        {/* Camera Permission or Hardware Error */}
        {cameraError && (
          <div className="absolute inset-0 z-20 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <CameraOff className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-sm text-rose-300">Camera Access Blocked</h4>
            <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed">
              {cameraError}
            </p>
            <button
              onClick={() => startCamera()}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* Video stream element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform ${
            facingMode === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Live Canvas for Face Bounding Box & HUD */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none transform ${
            facingMode === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Viewfinder Target Guidelines */}
        {!capturedSnapshot && !isLoadingModels && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Center target oval */}
            <div
              className={`w-52 h-64 border-2 rounded-[48%] border-dashed transition-all duration-300 ${
                isFaceInFrame
                  ? 'border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
              }`}
            />
          </div>
        )}

        {/* Status Bar Overlay */}
        <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between px-3 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/60 text-white">
          <div className="flex items-center gap-2 min-w-0">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            ) : isFaceInFrame ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ScanFace className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span className="text-xs font-medium text-slate-200 truncate">
              {isProcessing ? 'Verifying biometric signature...' : statusMessage}
            </span>
          </div>

          <button
            onClick={toggleCamera}
            title="Switch front/rear camera"
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Snapshot Preview Card if captured */}
      {capturedSnapshot && showPreview && (
        <div className="mt-4 flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl shadow-subtle w-full">
          <img
            src={capturedSnapshot}
            alt="Face Snapshot"
            className="w-14 h-14 rounded-lg object-cover border border-slate-200"
          />
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-800">Face Snapshot Captured</p>
            <p className="text-[11px] text-slate-500">128-dimensional embedding extracted</p>
          </div>
          <button
            type="button"
            onClick={handleRetake}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Retake
          </button>
        </div>
      )}

      {/* Trigger Button if not auto-capturing */}
      {!autoCaptureOnDetection && !capturedSnapshot && !isLoadingModels && !cameraError && (
        <div className="mt-4 w-full flex justify-center">
          <button
            type="button"
            onClick={handleManualCapture}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Biometrics...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Capture & Register Face</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

