"use client";
import { useId, useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/forms/PasswordInput";
import { formDefs } from "@/features/forms/field-definitions";
import {
  validateStaffCreation,
  validateStaffUpdate,
} from "@/lib/admin/staff-validation.mjs";
export type StaffInput = Record<string, string>;
/** STAFF FORM UI: independent vertical fields, red required marks and field-level errors. */
export default function StaffForm({
  onSave,
  initialValues,
  onCancel,
}: {
  onSave: (input: StaffInput) => Promise<void>;
  initialValues?: StaffInput;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<StaffInput>(initialValues || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const prefix = useId();
  const editing = Boolean(initialValues);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const issues = editing
      ? validateStaffUpdate(values)
      : validateStaffCreation(values);
    setErrors(issues);
    if (Object.keys(issues).length) return;
    setBusy(true);
    try {
      await onSave(values);
      setValues({});
    } catch (error) {
      const e = error as Error & { fields?: Record<string, string> };
      setErrors(e.fields || { form: e.message || "Unable to create staff." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      <div className="eyebrow">PULSE FITNESS</div>
      <h2>{editing ? "Edit staff profile" : "Create staff profile"}</h2>
      <p>
        {editing
          ? "Update contact details. Passwords remain unchanged."
          : "Set an initial password. Staff can change it after signing in."}
      </p>
      {errors.form && (
        <p className="error" role="alert">
          {errors.form}
        </p>
      )}
      <div className="form-grid form-grid--vertical">
        {formDefs.trainer
          .filter((field) => !editing || field.type !== "password")
          .map((field) => {
            const id = prefix + "-" + field.key;
            const describedBy =
              [
                field.hint ? id + "-help" : "",
                errors[field.key] ? id + "-error" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined;
            const shared = {
              id,
              required: true,
              disabled: busy,
              value: values[field.key] || "",
              onChange: (
                event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
              ) => setValues({ ...values, [field.key]: event.target.value }),
              "aria-invalid": Boolean(errors[field.key]),
              "aria-describedby": describedBy,
            };
            return (
              <label key={field.key} htmlFor={id}>
                <span>
                  {field.label.replace("Trainer", "Staff")}
                  <span className="required-mark" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </span>
                {field.type === "select" ? (
                  <select {...shared}>
                    <option value="">Select gender</option>
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "password" ? (
                  <PasswordInput
                    {...shared}
                    autoComplete="new-password"
                    minLength={6}
                  />
                ) : (
                  <input
                    {...shared}
                    type={field.type}
                    autoComplete={field.key === "username" ? "off" : undefined}
                    minLength={field.minLength}
                    maxLength={field.maxLength}
                    pattern={field.pattern}
                  />
                )}
                {field.hint && <small id={id + "-help"}>{field.hint}</small>}
                {errors[field.key] && (
                  <span className="field-error" id={id + "-error"}>
                    {errors[field.key]}
                  </span>
                )}
              </label>
            );
          })}
      </div>
      <div className="modal-actions">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setValues(initialValues || {});
            setErrors({});
            if (editing) onCancel?.();
          }}
        >
          {editing ? "Cancel edit" : "Clear form"}
        </Button>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save changes" : "Create staff"}
        </Button>
      </div>
    </form>
  );
}
