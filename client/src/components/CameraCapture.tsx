import { useRef, useCallback } from 'react';
import { resizeImage } from '../lib/utils';

interface Props {
  onCapture: (base64: string) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col gap-3">
      <button
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        className="btn-primary flex items-center justify-center gap-2 h-14"
      >
        <span className="text-xl">📸</span>
        <span>Add Food Photo</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
