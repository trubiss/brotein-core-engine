import { MealType } from './types';

export interface ScanResult {
  foodName: string;
  proteinGrams: number;
  carbsGrams?: number;
  fatsGrams?: number;
  portion: string;
  confidence: number; // 0..1
  mealType: MealType | null;
  notes?: string;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-food`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export async function scanFoodImage(imageDataUrl: string): Promise<ScanResult> {
  const resp = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify({ imageDataUrl }),
  });

  if (!resp.ok) {
    let msg = 'Scan failed';
    try { msg = (await resp.json()).error ?? msg; } catch { /* ignore */ }
    if (resp.status === 429) msg = 'Too many scans — try again in a minute.';
    if (resp.status === 402) msg = 'AI credits exhausted — top up your workspace.';
    throw new Error(msg);
  }
  return (await resp.json()) as ScanResult;
}

// Compress + resize an image File into a base64 data URL suitable for vision.
export async function fileToCompressedDataUrl(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}
