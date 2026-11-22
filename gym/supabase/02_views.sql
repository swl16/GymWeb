-- Virtual compatibility projections only; no combined account table.
-- Fresh Supabase project only. No accounts or business records are seeded.

create view public."profiles" with(security_invoker=true) as
 SELECT "User"."userID" AS id,
    "User".username,
    "User".name,
    "User".gender,
    "User"."dateOfBirth" AS date_of_birth,
    "User".age,
    "User"."phoneNo" AS phone,
    "User".email,
    'member'::text AS role,
    "User".height,
    "User".weight,
    "User"."accountStatus" AS account_status,
    "User"."weeklyTargetMinutes" AS weekly_target_minutes
   FROM "User"
UNION ALL
 SELECT "Staff"."staffID" AS id,
    "Staff".username,
    "Staff"."staffName" AS name,
    "Staff".gender,
    NULL::date AS date_of_birth,
    NULL::integer AS age,
    "Staff"."phoneNo" AS phone,
    "Staff".email,
    'staff'::text AS role,
    NULL::numeric(4,2) AS height,
    NULL::numeric(6,2) AS weight,
    'Active'::text AS account_status,
    NULL::integer AS weekly_target_minutes
   FROM "Staff"
UNION ALL
 SELECT "Trainer"."trainerID" AS id,
    "Trainer".username,
    "Trainer"."trainerName" AS name,
    "Trainer".gender,
    NULL::date AS date_of_birth,
    NULL::integer AS age,
    "Trainer"."phoneNo" AS phone,
    "Trainer".email,
    'trainer'::text AS role,
    NULL::numeric(4,2) AS height,
    NULL::numeric(6,2) AS weight,
    'Active'::text AS account_status,
    NULL::integer AS weekly_target_minutes
   FROM "Trainer";

create view public."staff" with(security_invoker=true) as
 SELECT "staffID" AS staff_id,
    username,
    "staffName" AS staff_name,
    gender,
    "phoneNo" AS phone_no,
    email
   FROM "Staff";

create view public."trainers" with(security_invoker=true) as
 SELECT "trainerID" AS trainer_id,
    username,
    "trainerName" AS trainer_name,
    gender,
    "phoneNo" AS phone_no,
    email
   FROM "Trainer";

create view public."membership_plans" with(security_invoker=true) as
 SELECT "planID" AS id,
    "planName" AS name,
    "durationMonths" AS duration_months,
    price,
    description AS benefits,
    archived,
    "classDiscount" AS class_discount_percent
   FROM "MembershipPlan";

create view public."user_subscriptions" with(security_invoker=true) as
 SELECT "subID" AS id,
    "userID" AS user_id,
    "planID" AS plan_id,
    "startDate" AS start_date,
    "expiryDate" AS end_date,
    "workflowStatus" AS status,
    "cancelledAt" AS cancelled_at
   FROM "UserSubscription";

create view public."class_types" with(security_invoker=true) as
 SELECT "classID" AS id,
    "className" AS name,
    fee,
    description,
    "defaultCapacity" AS default_capacity,
    archived
   FROM "ClassType";

create view public."class_bookings" with(security_invoker=true) as
 SELECT "bookingID" AS id,
    "userID" AS user_id,
    "scheduleID" AS schedule_id,
    "bookingDate" AS booked_at,
    "workflowStatus" AS status,
    attended,
    "cancelledAt" AS cancelled_at
   FROM "ClassBooking";

create view public."gym_attendance" with(security_invoker=true) as
 SELECT "attendanceID" AS id,
    "userID" AS user_id,
    "bookingID" AS booking_id,
    "checkedInAt" AS check_in,
    "checkedOutAt" AS check_out,
    "dateLog" AS date_log,
    "attendanceType" AS attendance_type
   FROM "GymAttendance";

create view public."fitness_logs" with(security_invoker=true) as
 SELECT "logID" AS id,
    "userID" AS user_id,
    "logDate" AS log_date,
    "fitnessGoal" AS goal,
    "workoutDuration" AS duration,
    weight,
    height,
    bmi,
    "caloriesBurned" AS calories_burned,
    "targetDuration" AS target_duration
   FROM "FitnessLog";

create view public."payments" with(security_invoker=true) as
 SELECT "paymentID" AS id,
    "userID" AS user_id,
    "subID" AS subscription_id,
    "bookingID" AS booking_id,
    "paymentType" AS payment_type,
    "paymentMethod" AS method,
    "finalAmount" AS amount,
    "workflowStatus" AS status,
    "submittedAt" AS created_at,
    "verifiedAt" AS verified_at,
    "staffID" AS verified_by,
    "receiptNo" AS receipt_no,
    "providerSessionID" AS provider_session_id,
    "needsReview" AS needs_review,
    "subtotalAmount" AS subtotal,
    "discountPercent" AS discount_percent,
    discount AS discount_amount,
    "taxRate" AS tax_rate,
    "taxAmount" AS tax_amount,
    "discountPlanName" AS discount_plan_name,
    "verifiedByName" AS verified_by_name
   FROM "Payment";

create view public."saved_cards" with(security_invoker=true) as
 SELECT "cardID" AS id,
    "userID" AS user_id,
    "providerMethodID" AS provider_method_id,
    "cardHolderName" AS holder,
    brand,
    last4,
    "expiryMonth" AS exp_month,
    "expiryYear" AS exp_year,
    "createdAt" AS created_at
   FROM "SavedCard";

create view public."class_schedules" with(security_invoker=true) as
 SELECT "scheduleID" AS id,
    "classNameSnapshot" AS name,
    "startsAt" AS starts_at,
    "endsAt" AS ends_at,
    "trainerNameSnapshot" AS trainer,
    room::text AS room,
    fee,
    "maxCapacity" AS capacity,
    "classStatus" AS status,
    "trainerID" AS trainer_id,
    "classID" AS class_id,
    "scheduleDate" AS schedule_date,
    "startTime" AS start_time,
    "endTime" AS end_time,
    "currentBooked" AS current_booked
   FROM "ClassSchedule";
