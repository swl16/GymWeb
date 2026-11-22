"use client";
import Button from "@/components/ui/Button";
import { useGym } from "@/features/app/GymProvider";
import EntityForm from "@/features/forms/EntityForm";
import { formDefs } from "@/features/forms/field-definitions";
/** LOGIN PAGE UI: username/password form. Account role is determined by the server. */
export default function LoginPage({ staff = false }: { staff?: boolean }) {
  const { open } = useGym();
  return (
    <>
      <EntityForm
        form={staff ? "staff-login" : "login"}
        title={staff ? "Staff sign in." : "Welcome back."}
        fields={formDefs.login}
        submitLabel="Sign in"
        afterFields={
          <div className="forgot-password-action">
            <Button variant="text" onClick={() => open("forgot-password")}>
              Forgot password?
            </Button>
          </div>
        }
      />

      {!staff && (
        <p className="form-switch">
          New to PULSE?{" "}
          <Button variant="text" onClick={() => open("register")}>
            Create an account
          </Button>
        </p>
      )}
      <div className="staff-access-actions">
        <Button
          variant="text"
          onClick={() => open(staff ? "login" : "staff-login")}
        >
          {staff ? "Member" : "Staff"}
        </Button>
        <Button variant="text" onClick={() => open("admin-login")}>
          Register Staff
        </Button>
      </div>
    </>
  );
}
