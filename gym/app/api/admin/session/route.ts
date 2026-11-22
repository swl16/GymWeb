import {
  adminCookie,
  hasAdminSession,
  loginAdmin,
  revokeAdminSession,
  sameOrigin,
} from "@/lib/admin/session";
import { failure } from "@/lib/server";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export function GET(request: Request) {
  try {
    return Response.json(
      { authenticated: hasAdminSession(request) },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Open admin sign-in from this website." },
      { status: 403, headers },
    );
  try {
    const { username, password } = await request.json();
    const result = await loginAdmin(username, password);
    if (!result.token)
      return Response.json(
        { error: result.error },
        { status: result.status, headers },
      );
    return Response.json(
      { message: "Admin signed in." },
      { headers: { ...headers, "Set-Cookie": adminCookie(result.token) } },
    );
  } catch (error) {
    return failure(error);
  }
}
export function DELETE(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Invalid request origin." },
      { status: 403, headers },
    );
  try {
    revokeAdminSession(request);
    return Response.json(
      { message: "Admin signed out." },
      { headers: { ...headers, "Set-Cookie": adminCookie() } },
    );
  } catch (error) {
    return failure(error);
  }
}
