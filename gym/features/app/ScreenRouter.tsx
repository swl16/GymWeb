'use client';
import Footer from '@/components/layout/Footer';
import PageHeading from '@/components/layout/PageHeading';
import AttendancePage from '@/features/attendance/AttendancePage';
import BookingsPage from '@/features/bookings/BookingsPage';
import ClassesPage from '@/features/classes/ClassesPage';
import MemberDashboard from '@/features/dashboard/MemberDashboard';
import StaffDashboard from '@/features/dashboard/StaffDashboard';
import TrainerDashboard from '@/features/dashboard/TrainerDashboard';
import FitnessPage from '@/features/fitness/FitnessPage';
import LandingPage from '@/features/landing/LandingPage';
import MembersPage from '@/features/members/MembersPage';
import MembershipsPage from '@/features/memberships/MembershipsPage';
import PaymentsPage from '@/features/payments/PaymentsPage';
import ProfilePage from '@/features/profile/ProfilePage';
import ReportsPage from '@/features/reports/ReportsPage';
import SettingsPage from '@/features/settings/SettingsPage';
import TrainersPage from '@/features/trainers/TrainersPage';
import { useGym } from './GymProvider';
/** Routes workspace tabs to independent screen components; server permissions remain authoritative. */
export default function ScreenRouter() {
  const { user, view, staff, trainer } = useGym();
  if (!user) return <LandingPage />;
  let screen;
  switch (view) {
    case 'overview':
      screen = staff ? (
        <StaffDashboard />
      ) : trainer ? (
        <TrainerDashboard />
      ) : (
        <MemberDashboard />
      );
      break;
    case 'memberships':
    case 'plans':
      screen = <MembershipsPage />;
      break;
    case 'classes':
      screen = <ClassesPage />;
      break;
    case 'attendance':
      screen = <AttendancePage />;
      break;
    case 'bookings':
      screen = <BookingsPage />;
      break;
    case 'payments':
      screen = <PaymentsPage />;
      break;
    case 'progress':
      screen = <FitnessPage />;
      break;
    case 'reports':
      screen = staff ? <ReportsPage /> : null;
      break;
    case 'trainers':
      screen = staff ? <TrainersPage /> : null;
      break;
    case 'members':
      screen = staff ? <MembersPage /> : null;
      break;
    case 'profile':
      screen = <ProfilePage />;
      break;
    case 'settings':
      screen = <SettingsPage />;
      break;
    default:
      screen = null;
  }
  return (
    <>
      <PageHeading />
      {screen}
      <Footer />
    </>
  );
}
