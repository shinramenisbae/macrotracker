import { useRef, useState, useCallback, useEffect } from 'react';
import { resizeImage } from '../lib/utils';

interface Props {
  onCapture: (base64: string) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1024 }, height: { ideal: 1024 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera not available. Use gallery upload instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const v = videoRef.current;
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    stopCamera();
    onCapture(base64);
  }, [onCapture, stopCamera]);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const base64 = await resizeImage(file);
      onCapture(base64);
      e.target.value = '';
    },
    [onCapture]
  );

  return (
    <div className="space-y-3">
      {cameraActive ? (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capture}
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-white border-4 border-accent active:scale-90 transition-transform"
            />
            <button
              onClick={stopCamera}
              className="w-12 h-12 rounded-full bg-dark-card/80 flex items-center justify-center text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cameraError && (
            <p className="text-sm text-red-400 text-center">{cameraError}</p>
          )}
          <button
            onClick={startCamera}
            disabled={disabled}
            className="btn-primary flex items-center justify-center gap-2 h-14"
          >
            <span className="text-xl">📷</span>
            <span>Open Camera</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="btn-secondary flex items-center justify-center gap-2 h-14"
          >
            <span className="text-xl">📁</span>
            <span>Choose from Gallery</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
