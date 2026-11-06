import { useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { cropImage, type CropArea } from '../lib/image';
import { Button } from './ui';

/**
 * Full-screen crop step shown after picking a photo: drag to position, pinch / slider to zoom,
 * rotate in 90° steps. The frame is square, the same shape the photo has on the site.
 */
export default function ImageCropper({
  src,
  onCancel,
  onDone,
}: {
  src: string;
  onCancel: () => void;
  onDone: (file: File) => void | Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    if (!area) return;
    setBusy(true);
    setError('');
    try {
      await onDone(await cropImage(src, area, rotation));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעיבוד התמונה');
      setBusy(false);
    }
  }

  // Rendered into <body> so no animated/transformed parent can shrink the full-screen layer.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="חיתוך תמונה">
      <div className="relative flex-1" dir="ltr">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          minZoom={1}
          maxZoom={4}
          zoomSpeed={0.3}
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <div className="space-y-3 bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-center text-sm text-muted">גוררים כדי למקם · צובטים או מזיזים את הסרגל לזום</p>
        <div className="flex items-center gap-3">
          <span aria-hidden="true">🔍</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 flex-1 accent-primary"
            aria-label="זום"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="rounded-full px-3 py-1.5 text-sm ring-1 ring-line"
            aria-label="סיבוב ב-90 מעלות"
          >
            ↻ סיבוב
          </button>
        </div>
        {error && <p className="text-center text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={busy} className="flex-1 py-3">
            ביטול
          </Button>
          <Button onClick={confirm} disabled={busy || !area} className="flex-[2] py-3">
            {busy ? 'מעלה…' : 'אישור והעלאה'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
