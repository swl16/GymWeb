import {
  CLASS_PICTURE_BUCKET,
  MAX_CLASS_PICTURE_BYTES,
  pictureFileError,
  pictureSignatureValid,
  classTypeErrors,
} from './domain/class-picture.mjs';
/** Storage is uploaded first, then class fields/path are committed by one database transaction. */
export async function saveClassTypePicture(db, user, form) {
  const permission = await db.rpc('is_staff');
  if (permission.error || !permission.data)
    return { status: 403, body: { error: 'Staff access required.' } };
  const payload = Object.fromEntries(
    ['id', 'name', 'fee', 'description', 'default_capacity'].map((k) => [
      k,
      String(form.get(k) || ''),
    ]),
  );
  const errors = classTypeErrors(payload);
  const file = form.get('picture');
  const hasFile = file && typeof file.arrayBuffer === 'function';
  if (file && !hasFile) errors.picture = 'Choose a JPEG, PNG or WebP picture.';
  if (hasFile) {
    const error = pictureFileError(file);
    if (error) errors.picture = error;
  }
  if (Object.keys(errors).length)
    return { status: 400, body: { error: 'Check the highlighted fields.', errors } };
  let previous = null;
  if (payload.id) {
    const result = await db
      .from('class_types')
      .select('id,image_path')
      .eq('id', payload.id)
      .single();
    if (result.error || !result.data)
      return { status: 404, body: { error: 'Class type is unavailable.' } };
    previous = result.data.image_path;
  }
  let uploaded = null;
  try {
    if (hasFile) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (
        bytes.byteLength > MAX_CLASS_PICTURE_BYTES ||
        !pictureSignatureValid(bytes, file.type)
      )
        return {
          status: 400,
          body: {
            errors: { picture: 'The file is not a valid JPEG, PNG or WebP picture.' },
          },
        };
      const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[
        file.type
      ];
      const path = user.id + '/' + crypto.randomUUID() + '.' + extension;
      const result = await db.storage
        .from(CLASS_PICTURE_BUCKET)
        .upload(path, bytes, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        });
      if (result.error) throw Error('Picture upload failed. Please try again.');
      uploaded = path;
      payload.image_path = path;
    } else if (form.get('remove_picture') === 'true') payload.image_path = null;
    const result = await db.rpc('gym_action', { action: 'save_class_type', payload });
    if (result.error) throw result.error;
    if (
      previous &&
      Object.hasOwn(payload, 'image_path') &&
      previous !== payload.image_path
    ) {
      // Never remove an image still referenced by a different class type.
      const refs = await db
        .from('class_types')
        .select('id')
        .eq('image_path', previous)
        .limit(1);
      if (!refs.error && !refs.data?.length) {
        const cleanup = await db.storage.from(CLASS_PICTURE_BUCKET).remove([previous]);
        if (cleanup.error) console.warn('Unused class picture cleanup deferred.');
      }
    }
    return { status: 200, body: { data: result.data, message: 'Class type saved.' } };
  } catch (error) {
    if (uploaded) {
      const cleanup = await db.storage.from(CLASS_PICTURE_BUCKET).remove([uploaded]);
      if (cleanup.error) console.warn('Failed class picture upload cleanup deferred.');
    }
    return {
      status: 400,
      body: { error: error?.message || 'Unable to save this class type.' },
    };
  }
}
