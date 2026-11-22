import { createClient } from '@supabase/supabase-js';
// Read-only connection/schema check. Prints counts, never credentials or personal records.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error('Configure the Supabase URL and server-only secret in .env.local.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const tables = [
  'User', 'Staff', 'Trainer', 'MembershipPlan', 'UserSubscription', 'ClassType',
  'ClassSchedule', 'ClassBooking', 'GymAttendance', 'FitnessLog', 'Payment', 'SavedCard',
  'booking_passes', 'payment_customers', 'payment_events', 'deleted_member_accounts',
];
for (const table of tables) {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
  if (error) throw Error(`${table}: schema check failed (${error.code}). See supabase/README.md.`);
  console.log(`${table}: ${count} rows`);
}
const { data: bucket, error } = await db.storage.getBucket('class-type-images');
if (error || !bucket) throw Error('Class-picture bucket is unavailable. See supabase/README.md.');
if (!bucket.public || bucket.file_size_limit !== 5242880 ||
    !['image/jpeg', 'image/png', 'image/webp'].every(type => bucket.allowed_mime_types?.includes(type)))
  throw Error('Class-picture bucket settings do not match the application.');
console.log('Supabase table and picture-bucket connection checks passed.');
