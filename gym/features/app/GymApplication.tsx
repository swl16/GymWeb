"use client";
import AppShell from "@/components/layout/AppShell";
import Toast from "@/components/ui/Toast";
import AppModals from "./AppModals";
import { GymProvider, useGym } from "./GymProvider";
import ScreenRouter from "./ScreenRouter";
/** ROOT COMPOSITION: provider + layout + screen + dialogs + notifications. */
function Workspace() {
  const { toast, setToast } = useGym();
  return (
    <>
      <AppShell>
        <ScreenRouter />
      </AppShell>
      <AppModals />
      <Toast message={toast} onDismiss={() => setToast("")} />
    </>
  );
}
export default function GymApplication({
  initialModal,
}: {
  initialModal?: "login" | "register" | "staff-login" | "admin-login";
}) {
  return (
    <GymProvider initialModal={initialModal}>
      <Workspace />
    </GymProvider>
  );
}
