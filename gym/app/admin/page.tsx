import StaffAdminPortal from '@/features/admin/StaffAdminPortal';
export const metadata = { title: 'PULSE | Staff administration' };
/** Dedicated staff administration route, independent of the member/staff dashboard shell. */
export default function Page() {
  return <StaffAdminPortal />;
}
