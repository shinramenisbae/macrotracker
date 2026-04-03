import { useEffect, useRef, useState } from 'react';

interface Props {
  onScan: (code: string) => void;
  active: boolean;
}

export default function BarcodeScanner({ onScan, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;
    let cancelled = false;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {}
        );
      } catch {
        if (!cancelled) setError('Could not start barcode scanner');
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [active, onScan]);

  if (!active) return null;

  return (
    <div className="space-y-3">
      <div
        id="barcode-reader"
        ref={containerRef}
        className="rounded-2xl overflow-hidden bg-black min-h-[280px]"
      />
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <p className="text-xs text-dark-muted text-center">
        Point your camera at a barcode
      </p>
    </div>
  );
}
