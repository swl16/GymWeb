-- Tables, validation constraints, relationships and indexes.
-- Fresh Supabase project only. Contains schema, not business or demo data.

create schema if not exists extensions;

create extension if not exists btree_gist with schema extensions;

set search_path = public, extensions, pg_temp;

create table public."payment_customers" (
  "user_id" uuid not null,
  "provider_customer_id" text not null
);

create table public."payment_events" (
  "event_id" text not null,
  "processed_at" timestamp with time zone default now() not null
);

create table public."SavedCard" (
  "cardID" uuid default gen_random_uuid() not null,
  "userID" uuid not null,
  "providerMethodID" text not null,
  "cardHolderName" text default ''::text not null,
  "brand" text not null,
  "last4" text not null,
  "expiryMonth" integer not null,
  "expiryYear" integer not null,
  "createdAt" timestamp with time zone default now() not null,
  "cardNumber" text generated always as (('************'::text || last4)) stored,
  "expiryDate" date generated always as ((((make_date("expiryYear", "expiryMonth", 1) + '1 mon'::interval))::date - 1)) stored,
  "cvv" text
);

create table public."User" (
  "userID" uuid not null,
  "username" text not null,
  "name" text not null,
  "gender" text not null,
  "dateOfBirth" date,
  "age" integer,
  "phoneNo" text not null,
  "email" text not null,
  "accountRole" text default 'member'::text not null,
  "height" numeric(4,2),
  "weight" numeric(6,2),
  "accountStatus" text default 'Active'::text not null,
  "weeklyTargetMinutes" integer,
  "password" text,
  "role" text default 'Normal user'::text not null
);

create table public."FitnessLog" (
  "logID" uuid default gen_random_uuid() not null,
  "userID" uuid not null,
  "logDate" date default ((now() AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::date not null,
  "fitnessGoal" text not null,
  "workoutDuration" integer not null,
  "weight" numeric(6,2) not null,
  "height" numeric(4,2) not null,
  "bmi" numeric generated always as (round((weight / (height * height)), 1)) stored not null,
  "caloriesBurned" numeric(10,2) default 0 not null,
  "targetDuration" integer not null
);

create table public."ClassSchedule" (
  "scheduleID" uuid default gen_random_uuid() not null,
  "classNameSnapshot" text not null,
  "startsAt" timestamp with time zone not null,
  "endsAt" timestamp with time zone not null,
  "trainerNameSnapshot" text not null,
  "room" integer not null,
  "fee" numeric(10,2) not null,
  "maxCapacity" integer not null,
  "classStatus" text default 'Active'::text not null,
  "trainerID" uuid not null,
  "classID" uuid not null,
  "scheduleDate" date generated always as ((("startsAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::date) stored,
  "startTime" time without time zone generated always as ((("startsAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::time without time zone) stored,
  "endTime" time without time zone generated always as ((("endsAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::time without time zone) stored,
  "currentBooked" integer default 0 not null
);

create table public."Staff" (
  "staffID" uuid not null,
  "username" text not null,
  "staffName" text not null,
  "gender" text not null,
  "phoneNo" text not null,
  "email" text not null,
  "password" text
);

create table public."Trainer" (
  "trainerID" uuid not null,
  "username" text not null,
  "trainerName" text not null,
  "gender" text not null,
  "phoneNo" text not null,
  "email" text not null,
  "password" text
);

create table public."MembershipPlan" (
  "planID" uuid default gen_random_uuid() not null,
  "planName" text not null,
  "durationMonths" integer not null,
  "price" numeric(10,2) not null,
  "description" text not null,
  "archived" boolean default false not null,
  "classDiscount" numeric(5,2) default 0 not null
);

create table public."Payment" (
  "paymentID" uuid default gen_random_uuid() not null,
  "userID" uuid,
  "subID" uuid,
  "bookingID" uuid,
  "paymentType" text not null,
  "paymentMethod" text not null,
  "finalAmount" numeric(10,2) not null,
  "workflowStatus" text default 'Pending'::text not null,
  "submittedAt" timestamp with time zone default now() not null,
  "verifiedAt" timestamp with time zone,
  "staffID" uuid,
  "receiptNo" text default ('PLS-'::text || upper(substr((gen_random_uuid())::text, 1, 8))) not null,
  "providerSessionID" text,
  "needsReview" boolean default false not null,
  "subtotalAmount" numeric(10,2) not null,
  "discountPercent" numeric(5,2) default 0 not null,
  "discount" numeric(10,2) default 0 not null,
  "taxRate" numeric(5,2) default 0 not null,
  "taxAmount" numeric(10,2) default 0 not null,
  "discountPlanName" text default ''::text not null,
  "verifiedByName" text,
  "paymentStatus" text generated always as (
CASE
    WHEN ("workflowStatus" = 'Rejected'::text) THEN 'Cancelled'::text
    ELSE "workflowStatus"
END) stored,
  "paymentDate" date generated always as ((("submittedAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::date) stored,
  "verifiedDate" date generated always as ((("verifiedAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::date) stored
);

create table public."booking_passes" (
  "booking_id" uuid not null,
  "token" uuid default gen_random_uuid() not null,
  "redeemed_at" timestamp with time zone
);

create table public."GymAttendance" (
  "attendanceID" uuid default gen_random_uuid() not null,
  "userID" uuid not null,
  "bookingID" uuid,
  "checkedInAt" timestamp with time zone default now() not null,
  "checkedOutAt" timestamp with time zone,
  "dateLog" date generated always as ((("checkedInAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::date) stored,
  "attendanceType" text not null,
  "checkInTime" time without time zone generated always as ((("checkedInAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::time without time zone) stored,
  "checkOutTime" time without time zone generated always as ((("checkedOutAt" AT TIME ZONE 'Asia/Kuala_Lumpur'::text))::time without time zone) stored
);

create table public."ClassType" (
  "classID" uuid default gen_random_uuid() not null,
  "className" text not null,
  "fee" numeric(10,2) not null,
  "description" text default ''::text not null,
  "defaultCapacity" integer not null,
  "archived" boolean default false not null,
  "imagePath" text
);

create table public."ClassBooking" (
  "bookingID" uuid default gen_random_uuid() not null,
  "userID" uuid not null,
  "scheduleID" uuid not null,
  "bookingDate" timestamp with time zone default now() not null,
  "workflowStatus" text default 'Pending'::text not null,
  "attended" boolean default false not null,
  "cancelledAt" timestamp with time zone,
  "classBooking" text not null,
  "bookingStatus" text generated always as (
CASE
    WHEN ("workflowStatus" = ANY (ARRAY['Rejected'::text, 'Cancelled'::text])) THEN 'Cancelled'::text
    ELSE 'Active'::text
END) stored
);

create table public."deleted_member_accounts" (
  "id" uuid not null,
  "username" text not null,
  "name" text not null,
  "membership_type" text not null,
  "deleted_at" timestamp with time zone default now() not null
);

create table public."UserSubscription" (
  "subID" uuid default gen_random_uuid() not null,
  "userID" uuid not null,
  "planID" uuid not null,
  "startDate" date not null,
  "expiryDate" date not null,
  "workflowStatus" text default 'Pending'::text not null,
  "cancelledAt" timestamp with time zone,
  "status" text default 'Scheduled'::text not null
);

alter table public."payment_customers" add constraint "payment_customers_pkey" PRIMARY KEY (user_id);

alter table public."payment_customers" add constraint "payment_customers_provider_customer_id_key" UNIQUE (provider_customer_id);

alter table public."payment_events" add constraint "payment_events_pkey" PRIMARY KEY (event_id);

alter table public."SavedCard" add constraint "SavedCard_cvv_check" CHECK (cvv IS NULL);

alter table public."SavedCard" add constraint "saved_cards_exp_month_check" CHECK ("expiryMonth" >= 1 AND "expiryMonth" <= 12);

alter table public."SavedCard" add constraint "saved_cards_last4_check" CHECK (last4 ~ '^[0-9]{4}$'::text);

alter table public."SavedCard" add constraint "saved_cards_pkey" PRIMARY KEY ("cardID");

alter table public."SavedCard" add constraint "saved_cards_provider_method_id_key" UNIQUE ("providerMethodID");

alter table public."User" add constraint "User_email_dictionary" CHECK (length(email) <= 100 AND email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@gmail[.]com$'::text);

alter table public."User" add constraint "User_password_check" CHECK (password IS NULL);

alter table public."User" add constraint "User_phone_dictionary" CHECK ("phoneNo" ~ '^01[0-9]{8,9}$'::text);

alter table public."User" add constraint "User_role_check" CHECK (role = ANY (ARRAY['Normal user'::text, 'Member'::text]));

alter table public."User" add constraint "User_username_dictionary" CHECK (username ~ '^[a-z0-9]{3,11}$'::text);

alter table public."User" add constraint "member_birth_details" CHECK ("accountRole" <> 'member'::text OR "dateOfBirth" IS NOT NULL AND age IS NOT NULL);

alter table public."User" add constraint "profile_measurement_limits" CHECK ((height IS NULL OR height <= 2.5) AND (weight IS NULL OR weight <= 300::numeric));

alter table public."User" add constraint "profile_strict_measurements" CHECK ((height IS NULL OR height > 1.30 AND height < 2.50) AND (weight IS NULL OR weight > 30::numeric AND weight < 300::numeric));

alter table public."User" add constraint "profiles_age_check" CHECK (age >= 1 AND age <= 120);

alter table public."User" add constraint "profiles_email_check" CHECK (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text);

alter table public."User" add constraint "profiles_gender_check" CHECK (gender = ANY (ARRAY['M'::text, 'F'::text]));

alter table public."User" add constraint "profiles_height_check" CHECK (height > 0::numeric AND height <= 3::numeric);

alter table public."User" add constraint "profiles_name_check" CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 100);

alter table public."User" add constraint "profiles_phone_check" CHECK ("phoneNo" ~ '^[0-9]{10,11}$'::text);

alter table public."User" add constraint "profiles_pkey" PRIMARY KEY ("userID");

alter table public."User" add constraint "profiles_role_check" CHECK ("accountRole" = ANY (ARRAY['member'::text, 'staff'::text, 'trainer'::text]));

alter table public."User" add constraint "profiles_username_key" UNIQUE (username);

alter table public."User" add constraint "profiles_weekly_target_minutes_check" CHECK ("weeklyTargetMinutes" >= 1 AND "weeklyTargetMinutes" <= 10080);

alter table public."User" add constraint "profiles_weight_check" CHECK (weight > 0::numeric AND weight <= 500::numeric);

alter table public."User" add constraint "user_account_status_dictionary" CHECK ("accountStatus" = ANY (ARRAY['Active'::text, 'Deleted'::text]));

alter table public."User" add constraint "user_birth_dictionary" CHECK ("accountRole" <> 'member'::text OR "dateOfBirth" <= '2008-12-31'::date);

alter table public."FitnessLog" add constraint "fitness_goal_dictionary" CHECK (length("fitnessGoal") >= 1 AND length("fitnessGoal") <= 255);

alter table public."FitnessLog" add constraint "fitness_logs_calories_burned_check" CHECK ("caloriesBurned" >= 0::numeric);

alter table public."FitnessLog" add constraint "fitness_logs_duration_check" CHECK ("workoutDuration" >= 0 AND "workoutDuration" <= 1440);

alter table public."FitnessLog" add constraint "fitness_logs_goal_check" CHECK (length(TRIM(BOTH FROM "fitnessGoal")) > 0);

alter table public."FitnessLog" add constraint "fitness_logs_height_check" CHECK (height > 0::numeric AND height <= 3::numeric);

alter table public."FitnessLog" add constraint "fitness_logs_pkey" PRIMARY KEY ("logID");

alter table public."FitnessLog" add constraint "fitness_logs_target_duration_check" CHECK ("targetDuration" >= 1 AND "targetDuration" <= 10080);

alter table public."FitnessLog" add constraint "fitness_logs_weight_check" CHECK (weight > 0::numeric AND weight <= 500::numeric);

alter table public."FitnessLog" add constraint "fitness_measurement_limits" CHECK (height <= 2.5 AND weight <= 300::numeric);

alter table public."FitnessLog" add constraint "fitness_strict_measurements" CHECK ((height IS NULL OR height > 1.30 AND height < 2.50) AND (weight IS NULL OR weight > 30::numeric AND weight < 300::numeric));

alter table public."ClassSchedule" add constraint "class_schedules_capacity_check" CHECK ("maxCapacity" > 0);

alter table public."ClassSchedule" add constraint "class_schedules_check" CHECK ("endsAt" > "startsAt");

alter table public."ClassSchedule" add constraint "class_schedules_fee_check" CHECK (fee >= 0::numeric);

alter table public."ClassSchedule" add constraint "class_schedules_name_check" CHECK (length(TRIM(BOTH FROM "classNameSnapshot")) > 0);

alter table public."ClassSchedule" add constraint "class_schedules_pkey" PRIMARY KEY ("scheduleID");

alter table public."ClassSchedule" add constraint "class_schedules_status_check" CHECK ("classStatus" = ANY (ARRAY['Active'::text, 'Cancelled'::text]));

alter table public."ClassSchedule" add constraint "class_schedules_trainer_check" CHECK (length(TRIM(BOTH FROM "trainerNameSnapshot")) > 0);

alter table public."ClassSchedule" add constraint "current_booked_within_capacity" CHECK ("currentBooked" >= 0 AND "currentBooked" <= "maxCapacity");

alter table public."ClassSchedule" add constraint "schedule_room_dictionary" CHECK (room >= 1 AND room <= 10);

alter table public."ClassSchedule" add constraint "schedule_room_no_overlap" EXCLUDE USING gist (room WITH =, tstzrange("startsAt", "endsAt", '[)'::text) WITH &&) WHERE ("classStatus" = 'Active'::text);

alter table public."ClassSchedule" add constraint "trainer_identity_no_overlap" EXCLUDE USING gist ("trainerID" WITH =, tstzrange("startsAt", "endsAt", '[)'::text) WITH &&) WHERE ("classStatus" = 'Active'::text AND "trainerID" IS NOT NULL);

alter table public."Staff" add constraint "Staff_email_dictionary" CHECK (length(email) <= 100 AND email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@gmail[.]com$'::text);

alter table public."Staff" add constraint "Staff_password_check" CHECK (password IS NULL);

alter table public."Staff" add constraint "Staff_phone_dictionary" CHECK ("phoneNo" ~ '^01[0-9]{8,9}$'::text);

alter table public."Staff" add constraint "Staff_username_dictionary" CHECK (username ~ '^[a-z0-9]{3,11}$'::text);

alter table public."Staff" add constraint "staff_gender_check" CHECK (gender = ANY (ARRAY['M'::text, 'F'::text]));

alter table public."Staff" add constraint "staff_pkey" PRIMARY KEY ("staffID");

alter table public."Staff" add constraint "staff_username_key" UNIQUE (username);

alter table public."Trainer" add constraint "Trainer_email_dictionary" CHECK (length(email) <= 100 AND email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@gmail[.]com$'::text);

alter table public."Trainer" add constraint "Trainer_password_check" CHECK (password IS NULL);

alter table public."Trainer" add constraint "Trainer_phone_dictionary" CHECK ("phoneNo" ~ '^01[0-9]{8,9}$'::text);

alter table public."Trainer" add constraint "Trainer_username_dictionary" CHECK (username ~ '^[a-z0-9]{3,11}$'::text);

alter table public."Trainer" add constraint "trainers_gender_check" CHECK (gender = ANY (ARRAY['M'::text, 'F'::text]));

alter table public."Trainer" add constraint "trainers_pkey" PRIMARY KEY ("trainerID");

alter table public."Trainer" add constraint "trainers_username_key" UNIQUE (username);

alter table public."MembershipPlan" add constraint "membership_plans_benefits_check" CHECK (length(TRIM(BOTH FROM description)) > 0);

alter table public."MembershipPlan" add constraint "membership_plans_class_discount_percent_check" CHECK ("classDiscount" >= 0::numeric AND "classDiscount" <= 100::numeric);

alter table public."MembershipPlan" add constraint "membership_plans_duration_months_check" CHECK ("durationMonths" > 0);

alter table public."MembershipPlan" add constraint "membership_plans_name_check" CHECK (length(TRIM(BOTH FROM "planName")) > 0);

alter table public."MembershipPlan" add constraint "membership_plans_pkey" PRIMARY KEY ("planID");

alter table public."MembershipPlan" add constraint "membership_plans_price_check" CHECK (price > 0::numeric);

alter table public."MembershipPlan" add constraint "plan_dictionary_lengths" CHECK (length("planName") >= 1 AND length("planName") <= 100 AND length(description) >= 1 AND length(description) <= 255 AND "durationMonths" >= 1 AND "durationMonths" <= 999 AND price < 1000000::numeric);

alter table public."Payment" add constraint "payment_dictionary_status" CHECK ("paymentStatus" = ANY (ARRAY['Pending'::text, 'Verified'::text, 'Cancelled'::text]));

alter table public."Payment" add constraint "payment_money_dictionary" CHECK ("subtotalAmount" < 1000000::numeric AND "taxAmount" < 1000000::numeric AND discount < 1000000::numeric AND "finalAmount" < 1000000::numeric);

alter table public."Payment" add constraint "payments_amount_check" CHECK ("finalAmount" >= 0::numeric);

alter table public."Payment" add constraint "payments_method_check" CHECK ("paymentMethod" = ANY (ARRAY['Cash'::text, 'Card'::text, 'E-wallet'::text]));

alter table public."Payment" add constraint "payments_payment_type_check" CHECK ("paymentType" = ANY (ARRAY['Membership'::text, 'Class'::text]));

alter table public."Payment" add constraint "payments_pkey" PRIMARY KEY ("paymentID");

alter table public."Payment" add constraint "payments_provider_session_id_key" UNIQUE ("providerSessionID");

alter table public."Payment" add constraint "payments_receipt_no_key" UNIQUE ("receiptNo");

alter table public."Payment" add constraint "payments_status_check" CHECK ("workflowStatus" = ANY (ARRAY['Pending'::text, 'Verified'::text, 'Rejected'::text]));

alter table public."booking_passes" add constraint "booking_passes_pkey" PRIMARY KEY (booking_id);

alter table public."booking_passes" add constraint "booking_passes_token_key" UNIQUE (token);

alter table public."GymAttendance" add constraint "attendance_type_valid" CHECK ("attendanceType" = ANY (ARRAY['Gym visit'::text, 'Class'::text]));

alter table public."GymAttendance" add constraint "gym_attendance_check" CHECK ("checkedOutAt" IS NULL OR "checkedOutAt" >= "checkedInAt");

alter table public."GymAttendance" add constraint "gym_attendance_pkey" PRIMARY KEY ("attendanceID");

alter table public."ClassType" add constraint "ClassType_imagePath_check" CHECK ("imagePath" IS NULL OR "imagePath" ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'::text);

alter table public."ClassType" add constraint "class_dictionary_lengths" CHECK (length("className") >= 1 AND length("className") <= 100 AND length(description) <= 255 AND fee < 1000000::numeric);

alter table public."ClassType" add constraint "class_types_default_capacity_check" CHECK ("defaultCapacity" > 0);

alter table public."ClassType" add constraint "class_types_fee_check" CHECK (fee >= 0::numeric);

alter table public."ClassType" add constraint "class_types_name_check" CHECK (length(TRIM(BOTH FROM "className")) >= 1 AND length(TRIM(BOTH FROM "className")) <= 100);

alter table public."ClassType" add constraint "class_types_pkey" PRIMARY KEY ("classID");

alter table public."ClassBooking" add constraint "booking_class_required" CHECK (length(TRIM(BOTH FROM "classBooking")) >= 1 AND length(TRIM(BOTH FROM "classBooking")) <= 100);

alter table public."ClassBooking" add constraint "class_bookings_pkey" PRIMARY KEY ("bookingID");

alter table public."ClassBooking" add constraint "class_bookings_status_check" CHECK ("workflowStatus" = ANY (ARRAY['Pending'::text, 'Booked'::text, 'Cancelled'::text, 'Rejected'::text]));

alter table public."deleted_member_accounts" add constraint "deleted_member_accounts_membership_type_check" CHECK (membership_type = ANY (ARRAY['Normal user'::text, 'Member'::text]));

alter table public."deleted_member_accounts" add constraint "deleted_member_accounts_pkey" PRIMARY KEY (id);

alter table public."UserSubscription" add constraint "UserSubscription_status_check" CHECK (status = ANY (ARRAY['Active'::text, 'Scheduled'::text, 'Expired'::text]));

alter table public."UserSubscription" add constraint "subscription_expiry_dictionary" CHECK ("expiryDate" > "startDate");

alter table public."UserSubscription" add constraint "user_subscriptions_pkey" PRIMARY KEY ("subID");

alter table public."UserSubscription" add constraint "user_subscriptions_status_check" CHECK ("workflowStatus" = ANY (ARRAY['Pending'::text, 'Active'::text, 'Expired'::text, 'Rejected'::text, 'Cancelled'::text]));

CREATE UNIQUE INDEX one_open_visit ON public."GymAttendance" USING btree ("userID") WHERE ("checkedOutAt" IS NULL);

CREATE INDEX fitness_user_date_idx ON public."FitnessLog" USING btree ("userID", "logDate");

CREATE INDEX class_schedules_type_idx ON public."ClassSchedule" USING btree ("classID");

CREATE UNIQUE INDEX one_attendance_per_booking ON public."GymAttendance" USING btree ("bookingID") WHERE ("bookingID" IS NOT NULL);

CREATE UNIQUE INDEX unique_live_class_type ON public."ClassType" USING btree (lower("className")) WHERE (NOT archived);

CREATE INDEX class_schedules_trainer_idx ON public."ClassSchedule" USING btree ("trainerID");

CREATE INDEX payments_user_date_idx ON public."Payment" USING btree ("userID", "submittedAt");

CREATE UNIQUE INDEX one_payment_booking ON public."Payment" USING btree ("bookingID") WHERE ("workflowStatus" <> 'Rejected'::text);

CREATE INDEX subscriptions_user_idx ON public."UserSubscription" USING btree ("userID");

CREATE INDEX payments_verified_by_idx ON public."Payment" USING btree ("staffID");

CREATE UNIQUE INDEX one_live_booking ON public."ClassBooking" USING btree ("userID", "scheduleID") WHERE ("workflowStatus" = ANY (ARRAY['Pending'::text, 'Booked'::text]));

CREATE INDEX bookings_schedule_idx ON public."ClassBooking" USING btree ("scheduleID");

CREATE UNIQUE INDEX one_payment_subscription ON public."Payment" USING btree ("subID") WHERE ("workflowStatus" <> 'Rejected'::text);


alter table public."payment_customers" add constraint "payment_customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES "User"("userID") ON DELETE CASCADE;

alter table public."SavedCard" add constraint "saved_cards_user_id_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE;

alter table public."User" add constraint "profiles_id_fkey" FOREIGN KEY ("userID") REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public."FitnessLog" add constraint "fitness_logs_user_id_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE;

alter table public."ClassSchedule" add constraint "class_schedules_class_id_fkey" FOREIGN KEY ("classID") REFERENCES "ClassType"("classID");

alter table public."ClassSchedule" add constraint "schedule_trainer_dictionary" FOREIGN KEY ("trainerID") REFERENCES "Trainer"("trainerID") ON DELETE RESTRICT;

alter table public."Staff" add constraint "staff_staff_id_fkey" FOREIGN KEY ("staffID") REFERENCES "User"("userID") ON DELETE CASCADE;

alter table public."Trainer" add constraint "trainers_trainer_id_fkey" FOREIGN KEY ("trainerID") REFERENCES "User"("userID") ON DELETE CASCADE;

alter table public."Payment" add constraint "payments_booking_id_fkey" FOREIGN KEY ("bookingID") REFERENCES "ClassBooking"("bookingID") ON DELETE SET NULL;

alter table public."Payment" add constraint "payments_subscription_id_fkey" FOREIGN KEY ("subID") REFERENCES "UserSubscription"("subID") ON DELETE SET NULL;

alter table public."Payment" add constraint "payments_user_id_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE SET NULL;

alter table public."Payment" add constraint "payments_verified_by_fkey" FOREIGN KEY ("staffID") REFERENCES "Staff"("staffID") ON DELETE SET NULL;

alter table public."booking_passes" add constraint "booking_passes_booking_id_fkey" FOREIGN KEY (booking_id) REFERENCES "ClassBooking"("bookingID") ON DELETE CASCADE;

alter table public."GymAttendance" add constraint "gym_attendance_booking_id_fkey" FOREIGN KEY ("bookingID") REFERENCES "ClassBooking"("bookingID") ON DELETE SET NULL;

alter table public."GymAttendance" add constraint "gym_attendance_user_id_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE;

alter table public."ClassBooking" add constraint "class_bookings_schedule_id_fkey" FOREIGN KEY ("scheduleID") REFERENCES "ClassSchedule"("scheduleID");

alter table public."ClassBooking" add constraint "class_bookings_user_id_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE;

alter table public."UserSubscription" add constraint "user_subscriptions_plan_id_fkey" FOREIGN KEY ("planID") REFERENCES "MembershipPlan"("planID");

alter table public."UserSubscription" add constraint "user_subscriptions_user_id_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE CASCADE;
