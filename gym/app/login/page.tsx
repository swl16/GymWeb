import GymApplication from '@/features/app/GymApplication';
/** LOGIN ROUTE: the login UI itself is features/auth/LoginPage.tsx. */
export default function LoginRoute() {
  return <GymApplication initialModal="login" />;
}
