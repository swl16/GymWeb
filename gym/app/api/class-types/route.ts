import { boundedFormData } from '@/lib/server/multipart';
import { authenticated, failure } from '@/lib/server';
import { MAX_CLASS_PICTURE_BYTES } from '@/lib/domain/class-picture.mjs';
import { saveClassTypePicture } from '@/lib/server-class-type.mjs';
/** Staff-only multipart endpoint; credentials are verified before any upload is accepted. */
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const length = Number(request.headers.get('content-length'));
    if (length > MAX_CLASS_PICTURE_BYTES + 65536)
      return Response.json({ error: 'Picture must not exceed 5 MB.' }, { status: 413 });
    const result = await saveClassTypePicture(
      db,
      user,
      await boundedFormData(request, MAX_CLASS_PICTURE_BYTES + 65536),
    );
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof RangeError)
      return Response.json({ error: error.message }, { status: 413 });
    return failure(error);
  }
}
