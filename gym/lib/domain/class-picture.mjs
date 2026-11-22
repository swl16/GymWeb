/** Shared image limits: browser checks are advisory; the server checks bytes too. */
export const CLASS_PICTURE_BUCKET = 'class-type-images';
export const MAX_CLASS_PICTURE_BYTES = 5 * 1024 * 1024;
export const CLASS_PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export function pictureFileError(file) {
  if (!CLASS_PICTURE_TYPES.includes(file?.type))
    return 'Choose a JPEG, PNG or WebP picture.';
  if (!file.size || file.size > MAX_CLASS_PICTURE_BYTES)
    return 'Choose a picture larger than 0 bytes and no larger than 5 MB.';
  return '';
}
export function picturePathValid(path) {
  return (
    typeof path === 'string' &&
    /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)
  );
}
export function pictureSignatureValid(bytes, type) {
  if (type === 'image/jpeg')
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === 'image/png')
    return [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  if (type === 'image/webp')
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  return false;
}
/** @returns {Record<string,string>} */
export function classTypeErrors(p) {
  const errors = {};
  if (!p.name?.trim() || p.name.length > 100)
    errors.name = 'Enter a class name (up to 100 characters).';
  if ((p.description || '').length > 255)
    errors.description = 'Description can contain up to 255 characters.';
  if (
    p.fee === '' ||
    p.fee == null ||
    !Number.isFinite(+p.fee) ||
    +p.fee < 0 ||
    +p.fee >= 1000000
  )
    errors.fee = 'Enter a fee from RM0.00 to RM999,999.99.';
  if (!Number.isInteger(+p.default_capacity) || +p.default_capacity < 1)
    errors.default_capacity = 'Enter a whole capacity of at least 1.';
  return errors;
}
