"use client";
import Button from "@/components/ui/Button";
import type { StaffRecord } from "@/lib/domain/models";
/** STAFF TABLE UI: contact details and explicit edit/delete actions; no passwords. */
export default function StaffTable({
  records,
  busy,
  onEdit,
  onDelete,
}: {
  records: StaffRecord[];
  busy: boolean;
  onEdit: (staff: StaffRecord) => void;
  onDelete: (staff: StaffRecord) => void;
}) {
  return records.length ? (
    <div className="staff-table-scroll">
      <table>
        <thead>
          <tr>
            {["Username", "Name", "Gender", "Phone", "Email", "Actions"].map(
              (h) => (
                <th key={h}>{h}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((staff) => (
            <tr key={staff.staff_id}>
              <td>{staff.username}</td>
              <td>{staff.staff_name}</td>
              <td>{staff.gender}</td>
              <td>{staff.phone_no}</td>
              <td>{staff.email}</td>
              <td>
                <div className="staff-row-actions">
                  <Button
                    variant="text"
                    disabled={busy}
                    onClick={() => onEdit(staff)}
                    aria-label={"Edit " + staff.staff_name}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() => onDelete(staff)}
                    aria-label={"Delete " + staff.staff_name}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p>No staff accounts yet. Register your first staff account below.</p>
  );
}
