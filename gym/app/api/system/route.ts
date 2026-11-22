import { accountServicesConfigured } from '@/lib/server-config';
export function GET() {
  return Response.json(
    { ready: accountServicesConfigured(), provider: 'Supabase' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
