import { useState, useRef, useId } from 'react';
import { resizeImage } from '../lib/utils';

interface Props {
  onSubmit: (weight: number, notes?: string, photo?: string) => void;
  loading?: boolean;
}

export default function WeightForm({ onSubmit, loading }: Props) {
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const prefix = useId();

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setPhotoBase64(base64);
    setPhotoPreview(`data:image/jpeg;base64,${base64}`);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weight);
    if (w <= 0) return;
    onSubmit(w, notes || undefined, photoBase64 || undefined);
    setWeight('');
    setNotes('');
    setPhotoPreview(null);
    setPhotoBase64(null);
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-semibold">Log Weight</h3>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor={`${prefix}-wt`} className="sr-only">Weight (kg)</label>
          <input
            id={`${prefix}-wt`}
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="input-field"
            placeholder="Weight (kg)"
            inputMode="decimal"
            required
          />
        </div>
        <button type="submit" disabled={loading || !weight} className="btn-primary h-[46px]">
          {loading ? '...' : 'Log'}
        </button>
      </div>
      <label htmlFor={`${prefix}-notes`} className="sr-only">Notes</label>
      <input
        id={`${prefix}-notes`}
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input-field"
        placeholder="Notes (optional)"
      />

      {/* Progress photo */}
      <div>
        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Progress photo preview"
              className="w-full aspect-[3/4] object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => {
                setPhotoPreview(null);
                setPhotoBase64(null);
              }}
              aria-label="Remove photo"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white text-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-secondary w-full flex items-center justify-center gap-2 h-12"
          >
            <span>📸</span>
            <span>Add Progress Photo</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          className="hidden"
        />
      </div>
    </form>
  );
}
