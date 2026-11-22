/** Exact physical ERD names; the UI model is normalized at this single boundary. */
export const erdNames = {
  // Read-only compatibility view; records remain in User, Staff or Trainer.
  profiles: { table: "profiles", columns: {} },
  staff: {
    table: "Staff",
    columns: {
      staff_id: "staffID",
      staff_name: "staffName",
      phone_no: "phoneNo",
    },
  },
  trainers: {
    table: "Trainer",
    columns: {
      trainer_id: "trainerID",
      trainer_name: "trainerName",
      phone_no: "phoneNo",
    },
  },
  membership_plans: {
    table: "MembershipPlan",
    columns: {
      id: "planID",
      name: "planName",
      duration_months: "durationMonths",
      class_discount_percent: "classDiscount",
      benefits: "description",
    },
  },
  user_subscriptions: {
    table: "UserSubscription",
    columns: {
      id: "subID",
      user_id: "userID",
      plan_id: "planID",
      start_date: "startDate",
      end_date: "expiryDate",
      status: "workflowStatus",
      cancelled_at: "cancelledAt",
    },
  },
  class_types: {
    table: "ClassType",
    columns: {
      id: "classID",
      name: "className",
      default_capacity: "defaultCapacity",
      image_path: "imagePath",
    },
  },
  class_schedules: {
    table: "ClassSchedule",
    columns: {
      id: "scheduleID",
      class_id: "classID",
      trainer_id: "trainerID",
      schedule_date: "scheduleDate",
      start_time: "startTime",
      end_time: "endTime",
      current_booked: "currentBooked",
      capacity: "maxCapacity",
      status: "classStatus",
      starts_at: "startsAt",
      ends_at: "endsAt",
      name: "classNameSnapshot",
      trainer: "trainerNameSnapshot",
    },
  },
  class_bookings: {
    table: "ClassBooking",
    columns: {
      id: "bookingID",
      user_id: "userID",
      schedule_id: "scheduleID",
      status: "workflowStatus",
      booked_at: "bookingDate",
      cancelled_at: "cancelledAt",
    },
  },
  gym_attendance: {
    table: "GymAttendance",
    columns: {
      id: "attendanceID",
      user_id: "userID",
      booking_id: "bookingID",
      attendance_type: "attendanceType",
      check_in: "checkedInAt",
      check_out: "checkedOutAt",
      date_log: "dateLog",
    },
  },
  fitness_logs: {
    table: "FitnessLog",
    columns: {
      id: "logID",
      user_id: "userID",
      log_date: "logDate",
      goal: "fitnessGoal",
      duration: "workoutDuration",
      target_duration: "targetDuration",
      calories_burned: "caloriesBurned",
    },
  },
  payments: {
    table: "Payment",
    columns: {
      id: "paymentID",
      user_id: "userID",
      subscription_id: "subID",
      booking_id: "bookingID",
      payment_type: "paymentType",
      method: "paymentMethod",
      amount: "finalAmount",
      status: "workflowStatus",
      created_at: "submittedAt",
      verified_at: "verifiedAt",
      verified_by: "staffID",
      verified_by_name: "verifiedByName",
      receipt_no: "receiptNo",
      provider_session_id: "providerSessionID",
      needs_review: "needsReview",
      subtotal: "subtotalAmount",
      discount_percent: "discountPercent",
      discount_amount: "discount",
      tax_rate: "taxRate",
      tax_amount: "taxAmount",
      discount_plan_name: "discountPlanName",
    },
  },
  saved_cards: {
    table: "SavedCard",
    columns: {
      id: "cardID",
      user_id: "userID",
      holder: "cardHolderName",
      provider_method_id: "providerMethodID",
      exp_month: "expiryMonth",
      exp_year: "expiryYear",
      created_at: "createdAt",
    },
  },
};
export function withErdNames(client) {
  return new Proxy(client, {
    get(target, key) {
      if (key !== "from") {
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      }
      return (name) => {
        const schema = erdNames[name];
        if (!schema) return target.from(name);
        const map = schema.columns,
          column = (k) => map[k] || k;
        const record = (v) =>
          Array.isArray(v)
            ? v.map(record)
            : v && typeof v === "object"
              ? Object.fromEntries(
                  Object.entries(v).map(([k, x]) => [column(k), x]),
                )
              : v;
        const inverse = Object.fromEntries(
          Object.entries(map).map(([k, v]) => [v, k]),
        );
        const normalize = (v) =>
          Array.isArray(v)
            ? v.map(normalize)
            : v && typeof v === "object"
              ? Object.fromEntries(
                  Object.entries(v)
                    .filter(([k]) => !(map[k] && map[k] !== k && !inverse[k]))
                    .map(([k, x]) => [inverse[k] || k, x]),
                )
              : v;
        const wrap = (builder) =>
          new Proxy(builder, {
            get(query, method) {
              if (method === "then")
                return (resolve, reject) =>
                  query.then(
                    (r) => resolve({ ...r, data: normalize(r.data) }),
                    reject,
                  );
              const fn = Reflect.get(query, method);
              if (typeof fn !== "function") return fn;
              return (...args) => {
                if (["insert", "update", "upsert"].includes(method))
                  args[0] = record(args[0]);
                if (
                  [
                    "eq",
                    "neq",
                    "gt",
                    "gte",
                    "lt",
                    "lte",
                    "in",
                    "is",
                    "like",
                    "ilike",
                    "order",
                    "not",
                    "filter",
                  ].includes(method)
                )
                  args[0] = column(args[0]);
                if (method === "select" && args[0] && args[0] !== "*")
                  args[0] = args[0]
                    .split(",")
                    .map((k) => column(k.trim()))
                    .join(",");
                if (method === "upsert" && args[1]?.onConflict)
                  args[1] = {
                    ...args[1],
                    onConflict: args[1].onConflict
                      .split(",")
                      .map(column)
                      .join(","),
                  };
                return wrap(fn.apply(query, args));
              };
            },
          });
        return wrap(target.from(schema.table));
      };
    },
  });
}
