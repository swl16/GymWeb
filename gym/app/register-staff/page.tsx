import GymApplication from "@/features/app/GymApplication";
export const metadata = { title: "PULSE | Register staff" };
/** Uses the same shell, providers and login flow as the home page. */
export default function StaffRegistrationRoute() {
  return <GymApplication initialModal="admin-login" />;
}
