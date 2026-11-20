import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;

// Primary local path with fallback to fast CDN
const MODEL_PATHS = ['/models', 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'];

/**
 * Loads face-api models with automatic fallback
 */
export async function loadFaceApiModels(
  onProgress?: (msg: string) => void
): Promise<void> {
  if (modelsLoaded) return;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    let loaded = false;

    for (const modelPath of MODEL_PATHS) {
      try {
        if (onProgress) onProgress(`Loading neural networks from ${modelPath}...`);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        ]);

        loaded = true;
        modelsLoaded = true;
        if (onProgress) onProgress('Face models initialized successfully.');
        break;
      } catch (err) {
        console.warn(`Failed loading face models from ${modelPath}:`, err);
      }
    }

    if (!loaded) {
      throw new Error(
        'Failed to load face recognition models from local storage and CDN.'
      );
    }
  })();

  return modelLoadingPromise;
}

export interface DetectionResult {
  descriptor: number[];
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
}

/**
 * Detect face and extract 128-dimensional biometric descriptor from video element
 */
export async function detectFace(
  video: HTMLVideoElement
): Promise<DetectionResult | null> {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }

  // Use TinyFaceDetector for smooth, real-time FPS
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });

  const detection = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  const { x, y, width, height } = detection.detection.box;

  return {
    descriptor: Array.from(detection.descriptor),
    box: { x, y, width, height },
    score: detection.detection.score,
  };
}

/**
 * Draw sleek bounding box with target corners and status
 */
export function drawBoundingBox(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
  videoWidth: number,
  videoHeight: number,
  label: string = 'Face Detected',
  isVerified: boolean = false
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Match canvas dimensions to video
  if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { x, y, width, height } = box;
  const color = isVerified ? '#10b981' : '#4f46e5';

  // Semi-transparent box background
  ctx.fillStyle = isVerified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(79, 70, 229, 0.06)';
  ctx.fillRect(x, y, width, height);

  // Rounded outline
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;

  // Draw corner brackets for high-tech HUD look
  const cornerLength = Math.min(24, width * 0.2, height * 0.2);

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + cornerLength);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cornerLength, y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + width - cornerLength, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + cornerLength);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + width, y + height - cornerLength);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width - cornerLength, y + height);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x + cornerLength, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + height - cornerLength);
  ctx.stroke();

  // Badge with label above box
  const badgeText = label;
  ctx.font = '600 12px Inter, sans-serif';
  const textMetrics = ctx.measureText(badgeText);
  const badgeWidth = textMetrics.width + 16;
  const badgeHeight = 22;
  const badgeY = Math.max(8, y - badgeHeight - 6);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, badgeY, badgeWidth, badgeHeight, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(badgeText, x + 8, badgeY + 15);
}

/**
 * Capture and crop face snapshot from video feed for preview
 */
export function captureFaceSnapshot(
  video: HTMLVideoElement,
  box?: { x: number; y: number; width: number; height: number }
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (box) {
    // Crop with margin around face
    const margin = Math.min(box.width, box.height) * 0.25;
    const cropX = Math.max(0, box.x - margin);
    const cropY = Math.max(0, box.y - margin);
    const cropW = Math.min(video.videoWidth - cropX, box.width + margin * 2);
    const cropH = Math.min(video.videoHeight - cropY, box.height + margin * 2);

    canvas.width = 160;
    canvas.height = 160;
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 160, 160);
  } else {
    // Capture center square
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    canvas.width = 160;
    canvas.height = 160;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 160, 160);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

