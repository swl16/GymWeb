'use client';
import { useState, type FormEvent } from 'react';
import { useGym } from '@/features/app/GymProvider';
import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
import { sb } from '@/lib/api/browser-client';
import { classTypeErrors, pictureFileError } from '@/lib/domain/class-picture.mjs';
import ClassTypePictureField from './ClassTypePictureField';
/** Class type editing owns its multipart request; image bytes never enter shared gym state. */
export default function ClassTypeForm() {
  const { values, errors, setErrors, setModal, load, notify, setBusy } = useGym();
  const [file, setFile] = useState<File | null>(null),
    [removed, setRemoved] = useState(false),
    [saving, setSaving] = useState(false);
  function choose(next: File) {
    const error = pictureFileError(next);
    setErrors({ ...errors, picture: error });
    if (!error) {
      setFile(next);
      setRemoved(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const next = classTypeErrors(values);
    if (file) {
      const error = pictureFileError(file);
      if (error) next.picture = error;
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setBusy(true);
    try {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) throw Error('Please sign in.');
      const form = new FormData();
      for (const key of ['id', 'name', 'description', 'fee', 'default_capacity'])
        form.set(key, String(values[key] ?? ''));
      if (file) form.set('picture', file);
      else if (removed) form.set('remove_picture', 'true');
      const response = await fetch('/api/class-types', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.access_token },
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors(
          result.errors || { form: result.error || 'Unable to save this class type.' },
        );
        return;
      }
      await load(session);
      notify('Class type saved.');
      setModal(null);
    } catch (error: any) {
      setErrors({ form: error.message || 'Unable to save this class type.' });
    } finally {
      setSaving(false);
      setBusy(false);
    }
  }
  return (
    <EntityForm
      form="class-type"
      title={values.id ? 'Edit class type' : 'Add class type'}
      fields={formDefs['class-type']}
      onSubmit={save}
      submitting={saving}
      afterFields={
        <ClassTypePictureField
          file={file}
          path={values.image_path}
          removed={removed}
          disabled={saving}
          error={errors.picture}
          onChoose={choose}
          onRemove={() => {
            setFile(null);
            setRemoved(true);
            setErrors({ ...errors, picture: '' });
          }}
        />
      }
    />
  );
}
