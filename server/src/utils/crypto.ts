import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

const getSecretKey = (): Buffer => {
  const secret = process.env.BIOMETRIC_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
  // Ensure exactly 32 bytes for aes-256
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypt a 128-float face descriptor array into an AES-256-GCM encrypted payload.
 */
export function encryptEmbedding(descriptor: number[]): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(descriptor);
  const encrypted = Buffer.concat([cipher.update(jsonStr, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Return base64 encoded: iv:tag:ciphertext
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt the AES-256-GCM payload back into the 128-float face descriptor array.
 */
export function decryptEmbedding(payload: string): number[] {
  const key = getSecretKey();
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted embedding format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Compute Euclidean distance between two 128-d face descriptors.
 * In face-api.js, a distance < 0.5 - 0.6 is considered a match.
 */
export function computeEuclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) {
    throw new Error('Descriptor length mismatch');
  }
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Convert Euclidean distance to confidence percentage (0 - 100%).
 * Distance 0 = 100% confidence. Distance >= threshold = < 50% confidence.
 */
export function distanceToConfidence(distance: number, threshold: number = 0.5): number {
  if (distance >= 1.0) return 0;
  // Non-linear mapping: distance 0 -> 100%, distance 0.3 -> ~85%, distance 0.5 -> 65%
  const confidence = Math.max(0, Math.min(100, Math.round((1 - (distance / (threshold * 1.5))) * 100)));
  return confidence;
}

