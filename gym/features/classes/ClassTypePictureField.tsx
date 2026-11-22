'use client';
import { useEffect, useId, useState, useRef } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { classPictureUrl } from '@/lib/api/class-picture';
/** Picture field UI: accessible file button, local preview and explicit removal. */
export default function ClassTypePictureField({
  file,
  path,
  removed,
  error,
  disabled,
  onChoose,
  onRemove,
}: {
  file: File | null;
  path?: string | null;
  removed: boolean;
  error?: string;
  disabled: boolean;
  onChoose: (file: File) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const image = preview || (!removed ? classPictureUrl(path) : null);
  return (
    <div className="class-picture-field">
      <label htmlFor={id}>
        Class picture <span className="muted">(optional)</span>
      </label>
      <div className="class-picture-preview">
        {image ? (
          <img src={image} alt="Selected class picture preview" />
        ) : (
          <div>
            <ImageIcon size={30} />
            <span>No picture selected</span>
          </div>
        )}
      </div>
      <div className="actions">
        <Button
          variant="secondary"
          className="picture-upload-button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          aria-describedby={id + '-help'}
        >
          <Upload size={16} />
          {image ? 'Replace picture' : 'Upload picture'}
        </Button>
        <input
          id={id}
          ref={input}
          tabIndex={-1}
          className="class-picture-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          aria-describedby={id + '-help' + (error ? ' ' + id + '-error' : '')}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            const next = e.target.files?.[0];
            if (next) onChoose(next);
            e.target.value = '';
          }}
        />
        {image && (
          <Button variant="text" disabled={disabled} onClick={onRemove}>
            Remove picture
          </Button>
        )}
      </div>
      <small id={id + '-help'}>
        JPEG, PNG or WebP · up to 5 MB. Use a picture suitable for public class listings.
      </small>
      {error && (
        <span id={id + '-error'} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
