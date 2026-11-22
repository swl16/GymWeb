/** Bound streamed request bodies even when Content-Length is omitted. */
export async function boundedFormData(request: Request, limit: number) {
  const type = request.headers.get('content-type') || '';
  if (!type.toLowerCase().startsWith('multipart/form-data;'))
    throw Error('Expected a picture upload form.');
  if (!request.body) throw Error('The upload form is empty.');
  const reader = request.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RangeError('Picture must not exceed 5 MB.');
      }
      chunks.push(value.slice().buffer as ArrayBuffer);
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(new Blob(chunks), { headers: { 'Content-Type': type } }).formData();
}
