'use client';
import { table } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { useGym } from '@/features/app/GymProvider';
import { memberDirectory } from '@/lib/domain/member-directory.mjs';
/** STAFF DIRECTORY UI: account lifecycle and current membership are separate columns. */
export default function MembersPage() {
  const { data, staff } = useGym();
  if (!staff) return null;
  return (
    <section className="panel member-directory">
      {table(
        [
          'Username',
          'Name',
          'Account status',
          'User type',
          'Age',
          'Gender',
          'Email',
          'Phone',
        ],
        memberDirectory(data).map((p) => [
          p.username,
          p.name,
          <Badge status={p.account_status} />,
          p.membership_type,
          p.age ?? '—',
          p.gender ?? '—',
          p.email || '—',
          p.phone || '—',
        ]),
      )}
    </section>
  );
}
