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
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1024 }, height: { ideal: 1024 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to actually start playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true);
          }).catch(() => {
            setCameraError('Could not start camera playback.');
          });
        };
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera not available. Use gallery upload instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Camera not ready yet. Wait a moment and try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    if (!base64 || base64.length < 100) {
      setCameraError('Failed to capture image. Try gallery upload instead.');
      return;
    }
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
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Starting camera...</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capture}
              disabled={disabled || !cameraReady}
              className="w-16 h-16 rounded-full bg-white border-4 border-accent active:scale-90 transition-transform disabled:opacity-50"
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
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
