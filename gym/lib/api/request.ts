import { sb } from './browser-client';
/** Authenticated JSON transport. All server endpoints still verify getUser and database permissions. */
export async function requestJson<T = Record<string, unknown>>(
  path: string,
  payload?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const session = await sb?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error('Please sign in.');
  const response = await fetch(path, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    signal,
  });
  const json = await response.json();
  if (!response.ok)
    throw new Error(typeof json.error === 'string' ? json.error : 'Request failed.');
  return json as T;
}
