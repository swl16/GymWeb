"use client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import LoginPage from "@/features/auth/LoginPage";
import ChangePasswordPage from "@/features/auth/ChangePasswordPage";
import PasswordResetPage from "@/features/auth/PasswordResetPage";
import SignupPage from "@/features/auth/SignupPage";
import AdminLoginPage from "@/features/admin/AdminLoginPage";
import StaffManagementPage from "@/features/admin/StaffManagementPage";
import AttendanceScanner from "@/features/bookings/AttendanceScanner";
import BookingDetails from "@/features/bookings/BookingDetails";
import ClassForm from "@/features/classes/ClassForm";
import ClassTypeForm from "@/features/classes/ClassTypeForm";
import MeasurementsForm from "@/features/fitness/MeasurementsForm";
import WeeklyTargetForm from "@/features/fitness/WeeklyTargetForm";
import FitnessForm from "@/features/fitness/FitnessForm";
import PlanForm from "@/features/memberships/PlanForm";
import PurchaseConfirmation from "@/features/payments/PurchaseConfirmation";
import CheckoutPage from "@/features/payments/CheckoutPage";
import ReceiptDialog from "@/features/payments/ReceiptDialog";
import ProfileForm from "@/features/profile/ProfileForm";
import TrainerForm from "@/features/trainers/TrainerForm";
import { useGym } from "./GymProvider";
/** DIALOG ROUTER: keeps every individual page/form in its own source file. */
export default function AppModals() {
  const { modal, values, busy, setModal, errors, act } = useGym();
  if (!modal) return null;
  let content;
  switch (modal.type) {
    case "login":
      content = <LoginPage />;
      break;
    case "register":
      content = <SignupPage />;
      break;
    case "staff-login":
      content = <LoginPage staff />;
      break;
    case "admin-login":
      content = <AdminLoginPage />;
      break;
    case "staff-admin":
      content = <StaffManagementPage />;
      break;
    case "forgot-password":
      content = <ForgotPasswordPage />;
      break;
    case "change-password":
      content = <ChangePasswordPage />;
      break;
    case "password-reset":
      content = <PasswordResetPage />;
      break;
    case "plan":
      content = <PlanForm />;
      break;
    case "class-type":
      content = <ClassTypeForm />;
      break;
    case "class":
      content = <ClassForm />;
      break;
    case "measurements":
      content = <MeasurementsForm />;
      break;
    case "weekly-target":
      content = <WeeklyTargetForm />;
      break;
    case "fitness":
      content = <FitnessForm />;
      break;
    case "profile":
      content = <ProfileForm />;
      break;
    case "trainer":
      content = <TrainerForm />;
      break;
    case "purchase-review":
      content = <PurchaseConfirmation />;
      break;
    case "checkout":
      content = <CheckoutPage />;
      break;
    case "add-card":
      content = <CheckoutPage adding />;
      break;
    case "receipt":
      content = <ReceiptDialog payment={modal.payment} />;
      break;
    case "booking":
      content = <BookingDetails bookingId={values.id} />;
      break;
    case "scanner":
      content = <AttendanceScanner />;
      break;
    case "confirm":
      content = (
        <ConfirmDialog
          title={modal.title}
          detail={modal.detail}
          error={errors.form}
          busy={busy}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            act(
              modal.action,
              { ...modal.p, confirm: true },
              "Action completed successfully.",
            );
          }}
        />
      );
      break;
    default:
      content = null;
  }
  return (
    <Modal
      key={modal.type + "-" + (values.id || values.target_id || "new")}
      title={modal.title || modal.type}
      busy={busy}
      className={modal.type === "staff-admin" ? "modal--wide" : undefined}
      onClose={() => setModal(null)}
    >
      {content}
    </Modal>
  );
}
