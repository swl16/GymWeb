/** ADMIN API TRANSPORT: browser sends its HttpOnly session cookie automatically. */
export async function staffRequest<T = { message: string }>(
  method: string,
  input?: unknown,
): Promise<T> {
  const response = await fetch("/api/admin/staff", {
    method,
    credentials: "same-origin",
    cache: "no-store",
    ...(input === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(Error(result.error || "Unable to manage staff."), {
      fields: result.errors,
    });
  return result;
}
