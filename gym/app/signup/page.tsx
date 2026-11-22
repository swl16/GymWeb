import GymApplication from '@/features/app/GymApplication';
/** SIGNUP ROUTE: the signup UI itself is features/auth/SignupPage.tsx. */
export default function SignupRoute() {
  return <GymApplication initialModal="register" />;
}
