import { sb } from './browser-client';
import { CLASS_PICTURE_BUCKET, picturePathValid } from '@/lib/domain/class-picture.mjs';
/** Store a portable path in ClassType, and derive the public promotional image URL here. */
export function classPictureUrl(path?: string | null) {
  return picturePathValid(path)
    ? sb.storage.from(CLASS_PICTURE_BUCKET).getPublicUrl(path!).data.publicUrl
    : null;
}
