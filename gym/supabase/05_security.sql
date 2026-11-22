-- Row-level policies, read-only identity projections and explicit privileges.
-- Fresh Supabase project only. No accounts or business records are seeded.

grant usage on schema public to anon,authenticated,service_role;

alter table public."payment_customers" enable row level security;

alter table public."payment_events" enable row level security;

alter table public."User" enable row level security;

alter table public."SavedCard" enable row level security;

alter table public."FitnessLog" enable row level security;

alter table public."ClassSchedule" enable row level security;

alter table public."Staff" enable row level security;

alter table public."Trainer" enable row level security;

alter table public."MembershipPlan" enable row level security;

alter table public."Payment" enable row level security;

alter table public."booking_passes" enable row level security;

alter table public."GymAttendance" enable row level security;

alter table public."ClassType" enable row level security;

alter table public."ClassBooking" enable row level security;

alter table public."deleted_member_accounts" enable row level security;

alter table public."UserSubscription" enable row level security;

revoke all on public."payment_customers" from public,anon,authenticated;

revoke all on public."payment_events" from public,anon,authenticated;

revoke all on public."User" from public,anon,authenticated;

revoke all on public."SavedCard" from public,anon,authenticated;

revoke all on public."FitnessLog" from public,anon,authenticated;

revoke all on public."ClassSchedule" from public,anon,authenticated;

revoke all on public."Staff" from public,anon,authenticated;

revoke all on public."Trainer" from public,anon,authenticated;

revoke all on public."MembershipPlan" from public,anon,authenticated;

revoke all on public."Payment" from public,anon,authenticated;

revoke all on public."booking_passes" from public,anon,authenticated;

revoke all on public."GymAttendance" from public,anon,authenticated;

revoke all on public."ClassType" from public,anon,authenticated;

revoke all on public."ClassBooking" from public,anon,authenticated;

revoke all on public."deleted_member_accounts" from public,anon,authenticated;

revoke all on public."UserSubscription" from public,anon,authenticated;

revoke all on public."profiles" from public,anon,authenticated;

revoke all on public."staff" from public,anon,authenticated;

revoke all on public."trainers" from public,anon,authenticated;

revoke all on public."membership_plans" from public,anon,authenticated;

revoke all on public."user_subscriptions" from public,anon,authenticated;

revoke all on public."class_types" from public,anon,authenticated;

revoke all on public."class_bookings" from public,anon,authenticated;

revoke all on public."gym_attendance" from public,anon,authenticated;

revoke all on public."fitness_logs" from public,anon,authenticated;

revoke all on public."payments" from public,anon,authenticated;

revoke all on public."saved_cards" from public,anon,authenticated;

revoke all on public."class_schedules" from public,anon,authenticated;

create policy "own_profile" on public."User" as PERMISSIVE for SELECT to "authenticated" using ((("userID" = auth.uid()) OR is_staff()));

create policy "own_cards" on public."SavedCard" as PERMISSIVE for SELECT to "authenticated" using (("userID" = auth.uid()));

create policy "own_records" on public."FitnessLog" as PERMISSIVE for SELECT to "authenticated" using ((("userID" = auth.uid()) OR is_staff()));

create policy "read_classes" on public."ClassSchedule" as PERMISSIVE for SELECT to "authenticated" using (((profile_role() <> 'trainer'::text) OR ("trainerID" = auth.uid())));

create policy "staff_directory" on public."Staff" as PERMISSIVE for SELECT to "authenticated" using (is_staff());

create policy "trainer_directory" on public."Trainer" as PERMISSIVE for SELECT to "authenticated" using ((is_staff() OR ("trainerID" = auth.uid())));

create policy "read_plans" on public."MembershipPlan" as PERMISSIVE for SELECT to "authenticated" using (true);

create policy "own_records" on public."Payment" as PERMISSIVE for SELECT to "authenticated" using ((("userID" = auth.uid()) OR is_staff()));

create policy "own_records" on public."GymAttendance" as PERMISSIVE for SELECT to "authenticated" using ((("userID" = auth.uid()) OR is_staff()));

create policy "assigned_trainer_attendance" on public."GymAttendance" as PERMISSIVE for SELECT to "authenticated" using ((("bookingID" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "ClassBooking" b
  WHERE ((b."bookingID" = "GymAttendance"."bookingID") AND trains_class(b."scheduleID"))))));

create policy "read_class_types" on public."ClassType" as PERMISSIVE for SELECT to "authenticated" using (true);

create policy "own_records" on public."ClassBooking" as PERMISSIVE for SELECT to "authenticated" using ((("userID" = auth.uid()) OR is_staff()));

create policy "trainer_bookings" on public."ClassBooking" as PERMISSIVE for SELECT to "authenticated" using (trains_class("scheduleID"));

create policy "staff_deleted_directory" on public."deleted_member_accounts" as PERMISSIVE for SELECT to "authenticated" using (is_staff());

create policy "own_records" on public."UserSubscription" as PERMISSIVE for SELECT to "authenticated" using ((("userID" = auth.uid()) OR is_staff()));

grant SELECT on public."profiles" to "anon";

grant SELECT on public."profiles" to "authenticated";

grant INSERT on public."profiles" to "service_role";

grant SELECT on public."profiles" to "service_role";

grant UPDATE on public."profiles" to "service_role";

grant DELETE on public."profiles" to "service_role";

grant TRUNCATE on public."profiles" to "service_role";

grant REFERENCES on public."profiles" to "service_role";

grant TRIGGER on public."profiles" to "service_role";

grant INSERT on public."staff" to "anon";

grant SELECT on public."staff" to "anon";

grant UPDATE on public."staff" to "anon";

grant DELETE on public."staff" to "anon";

grant TRUNCATE on public."staff" to "anon";

grant REFERENCES on public."staff" to "anon";

grant TRIGGER on public."staff" to "anon";

grant INSERT on public."staff" to "authenticated";

grant SELECT on public."staff" to "authenticated";

grant UPDATE on public."staff" to "authenticated";

grant DELETE on public."staff" to "authenticated";

grant TRUNCATE on public."staff" to "authenticated";

grant REFERENCES on public."staff" to "authenticated";

grant TRIGGER on public."staff" to "authenticated";

grant INSERT on public."staff" to "service_role";

grant SELECT on public."staff" to "service_role";

grant UPDATE on public."staff" to "service_role";

grant DELETE on public."staff" to "service_role";

grant TRUNCATE on public."staff" to "service_role";

grant REFERENCES on public."staff" to "service_role";

grant TRIGGER on public."staff" to "service_role";

grant INSERT on public."trainers" to "anon";

grant SELECT on public."trainers" to "anon";

grant UPDATE on public."trainers" to "anon";

grant DELETE on public."trainers" to "anon";

grant TRUNCATE on public."trainers" to "anon";

grant REFERENCES on public."trainers" to "anon";

grant TRIGGER on public."trainers" to "anon";

grant INSERT on public."trainers" to "authenticated";

grant SELECT on public."trainers" to "authenticated";

grant UPDATE on public."trainers" to "authenticated";

grant DELETE on public."trainers" to "authenticated";

grant TRUNCATE on public."trainers" to "authenticated";

grant REFERENCES on public."trainers" to "authenticated";

grant TRIGGER on public."trainers" to "authenticated";

grant INSERT on public."trainers" to "service_role";

grant SELECT on public."trainers" to "service_role";

grant UPDATE on public."trainers" to "service_role";

grant DELETE on public."trainers" to "service_role";

grant TRUNCATE on public."trainers" to "service_role";

grant REFERENCES on public."trainers" to "service_role";

grant TRIGGER on public."trainers" to "service_role";

grant INSERT on public."membership_plans" to "anon";

grant SELECT on public."membership_plans" to "anon";

grant UPDATE on public."membership_plans" to "anon";

grant DELETE on public."membership_plans" to "anon";

grant TRUNCATE on public."membership_plans" to "anon";

grant REFERENCES on public."membership_plans" to "anon";

grant TRIGGER on public."membership_plans" to "anon";

grant INSERT on public."membership_plans" to "authenticated";

grant SELECT on public."membership_plans" to "authenticated";

grant UPDATE on public."membership_plans" to "authenticated";

grant DELETE on public."membership_plans" to "authenticated";

grant TRUNCATE on public."membership_plans" to "authenticated";

grant REFERENCES on public."membership_plans" to "authenticated";

grant TRIGGER on public."membership_plans" to "authenticated";

grant INSERT on public."membership_plans" to "service_role";

grant SELECT on public."membership_plans" to "service_role";

grant UPDATE on public."membership_plans" to "service_role";

grant DELETE on public."membership_plans" to "service_role";

grant TRUNCATE on public."membership_plans" to "service_role";

grant REFERENCES on public."membership_plans" to "service_role";

grant TRIGGER on public."membership_plans" to "service_role";

grant INSERT on public."user_subscriptions" to "anon";

grant SELECT on public."user_subscriptions" to "anon";

grant UPDATE on public."user_subscriptions" to "anon";

grant DELETE on public."user_subscriptions" to "anon";

grant TRUNCATE on public."user_subscriptions" to "anon";

grant REFERENCES on public."user_subscriptions" to "anon";

grant TRIGGER on public."user_subscriptions" to "anon";

grant INSERT on public."user_subscriptions" to "authenticated";

grant SELECT on public."user_subscriptions" to "authenticated";

grant UPDATE on public."user_subscriptions" to "authenticated";

grant DELETE on public."user_subscriptions" to "authenticated";

grant TRUNCATE on public."user_subscriptions" to "authenticated";

grant REFERENCES on public."user_subscriptions" to "authenticated";

grant TRIGGER on public."user_subscriptions" to "authenticated";

grant INSERT on public."user_subscriptions" to "service_role";

grant SELECT on public."user_subscriptions" to "service_role";

grant UPDATE on public."user_subscriptions" to "service_role";

grant DELETE on public."user_subscriptions" to "service_role";

grant TRUNCATE on public."user_subscriptions" to "service_role";

grant REFERENCES on public."user_subscriptions" to "service_role";

grant TRIGGER on public."user_subscriptions" to "service_role";

grant INSERT on public."class_types" to "anon";

grant SELECT on public."class_types" to "anon";

grant UPDATE on public."class_types" to "anon";

grant DELETE on public."class_types" to "anon";

grant TRUNCATE on public."class_types" to "anon";

grant REFERENCES on public."class_types" to "anon";

grant TRIGGER on public."class_types" to "anon";

grant INSERT on public."class_types" to "authenticated";

grant SELECT on public."class_types" to "authenticated";

grant UPDATE on public."class_types" to "authenticated";

grant DELETE on public."class_types" to "authenticated";

grant TRUNCATE on public."class_types" to "authenticated";

grant REFERENCES on public."class_types" to "authenticated";

grant TRIGGER on public."class_types" to "authenticated";

grant INSERT on public."class_types" to "service_role";

grant SELECT on public."class_types" to "service_role";

grant UPDATE on public."class_types" to "service_role";

grant DELETE on public."class_types" to "service_role";

grant TRUNCATE on public."class_types" to "service_role";

grant REFERENCES on public."class_types" to "service_role";

grant TRIGGER on public."class_types" to "service_role";

grant INSERT on public."class_bookings" to "anon";

grant SELECT on public."class_bookings" to "anon";

grant UPDATE on public."class_bookings" to "anon";

grant DELETE on public."class_bookings" to "anon";

grant TRUNCATE on public."class_bookings" to "anon";

grant REFERENCES on public."class_bookings" to "anon";

grant TRIGGER on public."class_bookings" to "anon";

grant INSERT on public."class_bookings" to "authenticated";

grant SELECT on public."class_bookings" to "authenticated";

grant UPDATE on public."class_bookings" to "authenticated";

grant DELETE on public."class_bookings" to "authenticated";

grant TRUNCATE on public."class_bookings" to "authenticated";

grant REFERENCES on public."class_bookings" to "authenticated";

grant TRIGGER on public."class_bookings" to "authenticated";

grant INSERT on public."class_bookings" to "service_role";

grant SELECT on public."class_bookings" to "service_role";

grant UPDATE on public."class_bookings" to "service_role";

grant DELETE on public."class_bookings" to "service_role";

grant TRUNCATE on public."class_bookings" to "service_role";

grant REFERENCES on public."class_bookings" to "service_role";

grant TRIGGER on public."class_bookings" to "service_role";

grant INSERT on public."gym_attendance" to "anon";

grant SELECT on public."gym_attendance" to "anon";

grant UPDATE on public."gym_attendance" to "anon";

grant DELETE on public."gym_attendance" to "anon";

grant TRUNCATE on public."gym_attendance" to "anon";

grant REFERENCES on public."gym_attendance" to "anon";

grant TRIGGER on public."gym_attendance" to "anon";

grant INSERT on public."gym_attendance" to "authenticated";

grant SELECT on public."gym_attendance" to "authenticated";

grant UPDATE on public."gym_attendance" to "authenticated";

grant DELETE on public."gym_attendance" to "authenticated";

grant TRUNCATE on public."gym_attendance" to "authenticated";

grant REFERENCES on public."gym_attendance" to "authenticated";

grant TRIGGER on public."gym_attendance" to "authenticated";

grant INSERT on public."gym_attendance" to "service_role";

grant SELECT on public."gym_attendance" to "service_role";

grant UPDATE on public."gym_attendance" to "service_role";

grant DELETE on public."gym_attendance" to "service_role";

grant TRUNCATE on public."gym_attendance" to "service_role";

grant REFERENCES on public."gym_attendance" to "service_role";

grant TRIGGER on public."gym_attendance" to "service_role";

grant INSERT on public."fitness_logs" to "anon";

grant SELECT on public."fitness_logs" to "anon";

grant UPDATE on public."fitness_logs" to "anon";

grant DELETE on public."fitness_logs" to "anon";

grant TRUNCATE on public."fitness_logs" to "anon";

grant REFERENCES on public."fitness_logs" to "anon";

grant TRIGGER on public."fitness_logs" to "anon";

grant INSERT on public."fitness_logs" to "authenticated";

grant SELECT on public."fitness_logs" to "authenticated";

grant UPDATE on public."fitness_logs" to "authenticated";

grant DELETE on public."fitness_logs" to "authenticated";

grant TRUNCATE on public."fitness_logs" to "authenticated";

grant REFERENCES on public."fitness_logs" to "authenticated";

grant TRIGGER on public."fitness_logs" to "authenticated";

grant INSERT on public."fitness_logs" to "service_role";

grant SELECT on public."fitness_logs" to "service_role";

grant UPDATE on public."fitness_logs" to "service_role";

grant DELETE on public."fitness_logs" to "service_role";

grant TRUNCATE on public."fitness_logs" to "service_role";

grant REFERENCES on public."fitness_logs" to "service_role";

grant TRIGGER on public."fitness_logs" to "service_role";

grant INSERT on public."payments" to "anon";

grant SELECT on public."payments" to "anon";

grant UPDATE on public."payments" to "anon";

grant DELETE on public."payments" to "anon";

grant TRUNCATE on public."payments" to "anon";

grant REFERENCES on public."payments" to "anon";

grant TRIGGER on public."payments" to "anon";

grant INSERT on public."payments" to "authenticated";

grant SELECT on public."payments" to "authenticated";

grant UPDATE on public."payments" to "authenticated";

grant DELETE on public."payments" to "authenticated";

grant TRUNCATE on public."payments" to "authenticated";

grant REFERENCES on public."payments" to "authenticated";

grant TRIGGER on public."payments" to "authenticated";

grant INSERT on public."payments" to "service_role";

grant SELECT on public."payments" to "service_role";

grant UPDATE on public."payments" to "service_role";

grant DELETE on public."payments" to "service_role";

grant TRUNCATE on public."payments" to "service_role";

grant REFERENCES on public."payments" to "service_role";

grant TRIGGER on public."payments" to "service_role";

grant INSERT on public."saved_cards" to "anon";

grant SELECT on public."saved_cards" to "anon";

grant UPDATE on public."saved_cards" to "anon";

grant DELETE on public."saved_cards" to "anon";

grant TRUNCATE on public."saved_cards" to "anon";

grant REFERENCES on public."saved_cards" to "anon";

grant TRIGGER on public."saved_cards" to "anon";

grant INSERT on public."saved_cards" to "authenticated";

grant SELECT on public."saved_cards" to "authenticated";

grant UPDATE on public."saved_cards" to "authenticated";

grant DELETE on public."saved_cards" to "authenticated";

grant TRUNCATE on public."saved_cards" to "authenticated";

grant REFERENCES on public."saved_cards" to "authenticated";

grant TRIGGER on public."saved_cards" to "authenticated";

grant INSERT on public."saved_cards" to "service_role";

grant SELECT on public."saved_cards" to "service_role";

grant UPDATE on public."saved_cards" to "service_role";

grant DELETE on public."saved_cards" to "service_role";

grant TRUNCATE on public."saved_cards" to "service_role";

grant REFERENCES on public."saved_cards" to "service_role";

grant TRIGGER on public."saved_cards" to "service_role";

grant INSERT on public."payment_customers" to "service_role";

grant SELECT on public."payment_customers" to "service_role";

grant UPDATE on public."payment_customers" to "service_role";

grant DELETE on public."payment_customers" to "service_role";

grant TRUNCATE on public."payment_customers" to "service_role";

grant REFERENCES on public."payment_customers" to "service_role";

grant TRIGGER on public."payment_customers" to "service_role";

grant INSERT on public."payment_events" to "service_role";

grant SELECT on public."payment_events" to "service_role";

grant UPDATE on public."payment_events" to "service_role";

grant DELETE on public."payment_events" to "service_role";

grant TRUNCATE on public."payment_events" to "service_role";

grant REFERENCES on public."payment_events" to "service_role";

grant TRIGGER on public."payment_events" to "service_role";

grant SELECT on public."User" to "authenticated";

grant TRUNCATE on public."User" to "authenticated";

grant REFERENCES on public."User" to "authenticated";

grant TRIGGER on public."User" to "authenticated";

grant INSERT on public."User" to "service_role";

grant SELECT on public."User" to "service_role";

grant UPDATE on public."User" to "service_role";

grant DELETE on public."User" to "service_role";

grant TRUNCATE on public."User" to "service_role";

grant REFERENCES on public."User" to "service_role";

grant TRIGGER on public."User" to "service_role";

grant SELECT on public."SavedCard" to "anon";

grant TRUNCATE on public."SavedCard" to "anon";

grant REFERENCES on public."SavedCard" to "anon";

grant TRIGGER on public."SavedCard" to "anon";

grant SELECT on public."SavedCard" to "authenticated";

grant TRUNCATE on public."SavedCard" to "authenticated";

grant REFERENCES on public."SavedCard" to "authenticated";

grant TRIGGER on public."SavedCard" to "authenticated";

grant INSERT on public."SavedCard" to "service_role";

grant SELECT on public."SavedCard" to "service_role";

grant UPDATE on public."SavedCard" to "service_role";

grant DELETE on public."SavedCard" to "service_role";

grant TRUNCATE on public."SavedCard" to "service_role";

grant REFERENCES on public."SavedCard" to "service_role";

grant TRIGGER on public."SavedCard" to "service_role";

grant SELECT on public."FitnessLog" to "authenticated";

grant TRUNCATE on public."FitnessLog" to "authenticated";

grant REFERENCES on public."FitnessLog" to "authenticated";

grant TRIGGER on public."FitnessLog" to "authenticated";

grant INSERT on public."FitnessLog" to "service_role";

grant SELECT on public."FitnessLog" to "service_role";

grant UPDATE on public."FitnessLog" to "service_role";

grant DELETE on public."FitnessLog" to "service_role";

grant TRUNCATE on public."FitnessLog" to "service_role";

grant REFERENCES on public."FitnessLog" to "service_role";

grant TRIGGER on public."FitnessLog" to "service_role";

grant SELECT on public."ClassSchedule" to "authenticated";

grant TRUNCATE on public."ClassSchedule" to "authenticated";

grant REFERENCES on public."ClassSchedule" to "authenticated";

grant TRIGGER on public."ClassSchedule" to "authenticated";

grant INSERT on public."ClassSchedule" to "service_role";

grant SELECT on public."ClassSchedule" to "service_role";

grant UPDATE on public."ClassSchedule" to "service_role";

grant DELETE on public."ClassSchedule" to "service_role";

grant TRUNCATE on public."ClassSchedule" to "service_role";

grant REFERENCES on public."ClassSchedule" to "service_role";

grant TRIGGER on public."ClassSchedule" to "service_role";

grant SELECT on public."Staff" to "anon";

grant TRUNCATE on public."Staff" to "anon";

grant REFERENCES on public."Staff" to "anon";

grant TRIGGER on public."Staff" to "anon";

grant SELECT on public."Staff" to "authenticated";

grant TRUNCATE on public."Staff" to "authenticated";

grant REFERENCES on public."Staff" to "authenticated";

grant TRIGGER on public."Staff" to "authenticated";

grant INSERT on public."Staff" to "service_role";

grant SELECT on public."Staff" to "service_role";

grant UPDATE on public."Staff" to "service_role";

grant DELETE on public."Staff" to "service_role";

grant TRUNCATE on public."Staff" to "service_role";

grant REFERENCES on public."Staff" to "service_role";

grant TRIGGER on public."Staff" to "service_role";

grant INSERT on public."class_schedules" to "anon";

grant SELECT on public."class_schedules" to "anon";

grant UPDATE on public."class_schedules" to "anon";

grant DELETE on public."class_schedules" to "anon";

grant TRUNCATE on public."class_schedules" to "anon";

grant REFERENCES on public."class_schedules" to "anon";

grant TRIGGER on public."class_schedules" to "anon";

grant INSERT on public."class_schedules" to "authenticated";

grant SELECT on public."class_schedules" to "authenticated";

grant UPDATE on public."class_schedules" to "authenticated";

grant DELETE on public."class_schedules" to "authenticated";

grant TRUNCATE on public."class_schedules" to "authenticated";

grant REFERENCES on public."class_schedules" to "authenticated";

grant TRIGGER on public."class_schedules" to "authenticated";

grant INSERT on public."class_schedules" to "service_role";

grant SELECT on public."class_schedules" to "service_role";

grant UPDATE on public."class_schedules" to "service_role";

grant DELETE on public."class_schedules" to "service_role";

grant TRUNCATE on public."class_schedules" to "service_role";

grant REFERENCES on public."class_schedules" to "service_role";

grant TRIGGER on public."class_schedules" to "service_role";

grant SELECT on public."Trainer" to "anon";

grant TRUNCATE on public."Trainer" to "anon";

grant REFERENCES on public."Trainer" to "anon";

grant TRIGGER on public."Trainer" to "anon";

grant SELECT on public."Trainer" to "authenticated";

grant TRUNCATE on public."Trainer" to "authenticated";

grant REFERENCES on public."Trainer" to "authenticated";

grant TRIGGER on public."Trainer" to "authenticated";

grant INSERT on public."Trainer" to "service_role";

grant SELECT on public."Trainer" to "service_role";

grant UPDATE on public."Trainer" to "service_role";

grant DELETE on public."Trainer" to "service_role";

grant TRUNCATE on public."Trainer" to "service_role";

grant REFERENCES on public."Trainer" to "service_role";

grant TRIGGER on public."Trainer" to "service_role";

grant SELECT on public."MembershipPlan" to "authenticated";

grant TRUNCATE on public."MembershipPlan" to "authenticated";

grant REFERENCES on public."MembershipPlan" to "authenticated";

grant TRIGGER on public."MembershipPlan" to "authenticated";

grant INSERT on public."MembershipPlan" to "service_role";

grant SELECT on public."MembershipPlan" to "service_role";

grant UPDATE on public."MembershipPlan" to "service_role";

grant DELETE on public."MembershipPlan" to "service_role";

grant TRUNCATE on public."MembershipPlan" to "service_role";

grant REFERENCES on public."MembershipPlan" to "service_role";

grant TRIGGER on public."MembershipPlan" to "service_role";

grant SELECT on public."Payment" to "authenticated";

grant TRUNCATE on public."Payment" to "authenticated";

grant REFERENCES on public."Payment" to "authenticated";

grant TRIGGER on public."Payment" to "authenticated";

grant INSERT on public."Payment" to "service_role";

grant SELECT on public."Payment" to "service_role";

grant UPDATE on public."Payment" to "service_role";

grant DELETE on public."Payment" to "service_role";

grant TRUNCATE on public."Payment" to "service_role";

grant REFERENCES on public."Payment" to "service_role";

grant TRIGGER on public."Payment" to "service_role";

grant INSERT on public."booking_passes" to "service_role";

grant SELECT on public."booking_passes" to "service_role";

grant UPDATE on public."booking_passes" to "service_role";

grant DELETE on public."booking_passes" to "service_role";

grant TRUNCATE on public."booking_passes" to "service_role";

grant REFERENCES on public."booking_passes" to "service_role";

grant TRIGGER on public."booking_passes" to "service_role";

grant SELECT on public."GymAttendance" to "authenticated";

grant TRUNCATE on public."GymAttendance" to "authenticated";

grant REFERENCES on public."GymAttendance" to "authenticated";

grant TRIGGER on public."GymAttendance" to "authenticated";

grant INSERT on public."GymAttendance" to "service_role";

grant SELECT on public."GymAttendance" to "service_role";

grant UPDATE on public."GymAttendance" to "service_role";

grant DELETE on public."GymAttendance" to "service_role";

grant TRUNCATE on public."GymAttendance" to "service_role";

grant REFERENCES on public."GymAttendance" to "service_role";

grant TRIGGER on public."GymAttendance" to "service_role";

grant SELECT on public."ClassType" to "authenticated";

grant TRUNCATE on public."ClassType" to "authenticated";

grant REFERENCES on public."ClassType" to "authenticated";

grant TRIGGER on public."ClassType" to "authenticated";

grant INSERT on public."ClassType" to "service_role";

grant SELECT on public."ClassType" to "service_role";

grant UPDATE on public."ClassType" to "service_role";

grant DELETE on public."ClassType" to "service_role";

grant TRUNCATE on public."ClassType" to "service_role";

grant REFERENCES on public."ClassType" to "service_role";

grant TRIGGER on public."ClassType" to "service_role";

grant SELECT on public."ClassBooking" to "authenticated";

grant TRUNCATE on public."ClassBooking" to "authenticated";

grant REFERENCES on public."ClassBooking" to "authenticated";

grant TRIGGER on public."ClassBooking" to "authenticated";

grant INSERT on public."ClassBooking" to "service_role";

grant SELECT on public."ClassBooking" to "service_role";

grant UPDATE on public."ClassBooking" to "service_role";

grant DELETE on public."ClassBooking" to "service_role";

grant TRUNCATE on public."ClassBooking" to "service_role";

grant REFERENCES on public."ClassBooking" to "service_role";

grant TRIGGER on public."ClassBooking" to "service_role";

grant SELECT on public."deleted_member_accounts" to "authenticated";

grant TRUNCATE on public."deleted_member_accounts" to "authenticated";

grant REFERENCES on public."deleted_member_accounts" to "authenticated";

grant TRIGGER on public."deleted_member_accounts" to "authenticated";

grant INSERT on public."deleted_member_accounts" to "service_role";

grant SELECT on public."deleted_member_accounts" to "service_role";

grant UPDATE on public."deleted_member_accounts" to "service_role";

grant DELETE on public."deleted_member_accounts" to "service_role";

grant TRUNCATE on public."deleted_member_accounts" to "service_role";

grant REFERENCES on public."deleted_member_accounts" to "service_role";

grant TRIGGER on public."deleted_member_accounts" to "service_role";

grant SELECT on public."UserSubscription" to "authenticated";

grant TRUNCATE on public."UserSubscription" to "authenticated";

grant REFERENCES on public."UserSubscription" to "authenticated";

grant TRIGGER on public."UserSubscription" to "authenticated";

grant INSERT on public."UserSubscription" to "service_role";

grant SELECT on public."UserSubscription" to "service_role";

grant UPDATE on public."UserSubscription" to "service_role";

grant DELETE on public."UserSubscription" to "service_role";

grant TRUNCATE on public."UserSubscription" to "service_role";

grant REFERENCES on public."UserSubscription" to "service_role";

grant TRIGGER on public."UserSubscription" to "service_role";

revoke all on function public.trains_class(uuid) from public,anon,authenticated,service_role;

grant execute on function public.trains_class(uuid) to "authenticated";

grant execute on function public.trains_class(uuid) to "service_role";

revoke all on function public.protect_provider_payment_history() from public,anon,authenticated,service_role;

grant execute on function public.protect_provider_payment_history() to "service_role";

revoke all on function public.profile_role() from public,anon,authenticated,service_role;

grant execute on function public.profile_role() to "authenticated";

grant execute on function public.profile_role() to "service_role";

revoke all on function public.class_roster() from public,anon,authenticated,service_role;

grant execute on function public.class_roster() to "authenticated";

grant execute on function public.class_roster() to "service_role";

revoke all on function public.class_availability() from public,anon,authenticated,service_role;

grant execute on function public.class_availability() to "authenticated";

grant execute on function public.class_availability() to "service_role";

revoke all on function public.invoice_quote_for(uuid,text,uuid) from public,anon,authenticated,service_role;

grant execute on function public.invoice_quote_for(uuid,text,uuid) to "service_role";

revoke all on function public.is_staff() from public,anon,authenticated,service_role;

grant execute on function public.is_staff() to "authenticated";

grant execute on function public.is_staff() to "service_role";

revoke all on function public.invoice_quote(text,uuid) from public,anon,authenticated,service_role;

grant execute on function public.invoice_quote(text,uuid) to "authenticated";

grant execute on function public.invoice_quote(text,uuid) to "service_role";

revoke all on function public.issue_booking_pass(uuid) from public,anon,authenticated,service_role;

grant execute on function public.issue_booking_pass(uuid) to "authenticated";

grant execute on function public.issue_booking_pass(uuid) to "service_role";

revoke all on function public.require_adult_member_registration() from public,anon,authenticated,service_role;

grant execute on function public.require_adult_member_registration() to "service_role";

revoke all on function public.redeem_booking_attendance(uuid,text) from public,anon,authenticated,service_role;

grant execute on function public.redeem_booking_attendance(uuid,text) to "authenticated";

grant execute on function public.redeem_booking_attendance(uuid,text) to "service_role";

revoke all on function public.redeem_booking_pass(uuid) from public,anon,authenticated,service_role;

grant execute on function public.redeem_booking_pass(uuid) to "authenticated";

grant execute on function public.redeem_booking_pass(uuid) to "service_role";

revoke all on function public.gym_action_v6(text,jsonb) from public,anon,authenticated,service_role;

grant execute on function public.gym_action_v6(text,jsonb) to "service_role";

revoke all on function public.gym_action_v7(text,jsonb) from public,anon,authenticated,service_role;

grant execute on function public.gym_action_v7(text,jsonb) to "service_role";

revoke all on function public.gym_action_v9(text,jsonb) from public,anon,authenticated,service_role;

grant execute on function public.gym_action_v9(text,jsonb) to "service_role";

revoke all on function public.snapshot_cash_verifier() from public,anon,authenticated,service_role;

grant execute on function public.snapshot_cash_verifier() to "service_role";

revoke all on function public.record_deleted_member() from public,anon,authenticated,service_role;

grant execute on function public.record_deleted_member() to "service_role";

revoke all on function public.gym_action_v11(text,jsonb) from public,anon,authenticated,service_role;

grant execute on function public.gym_action_v11(text,jsonb) to "service_role";

revoke all on function public.sync_current_booked() from public,anon,authenticated,service_role;

grant execute on function public.sync_current_booked() to "service_role";

revoke all on function public.refresh_membership_dictionary() from public,anon,authenticated,service_role;

grant execute on function public.refresh_membership_dictionary() to "authenticated";

grant execute on function public.refresh_membership_dictionary() to "service_role";

revoke all on function public.sync_dictionary_membership_role() from public,anon,authenticated,service_role;

grant execute on function public.sync_dictionary_membership_role() to "service_role";

revoke all on function public.begin_online_payment(text,uuid) from public,anon,authenticated,service_role;

grant execute on function public.begin_online_payment(text,uuid) to "authenticated";

grant execute on function public.begin_online_payment(text,uuid) to "service_role";

revoke all on function public.gym_action_v5(text,jsonb) from public,anon,authenticated,service_role;

grant execute on function public.gym_action_v5(text,jsonb) to "service_role";

revoke all on function public.snapshot_booking_class() from public,anon,authenticated,service_role;

grant execute on function public.snapshot_booking_class() to "service_role";

revoke all on function public.subscription_dictionary_status() from public,anon,authenticated,service_role;

grant execute on function public.subscription_dictionary_status() to "service_role";

revoke all on function public.set_attendance_type() from public,anon,authenticated,service_role;

grant execute on function public.set_attendance_type() to "service_role";

revoke all on function public.dictionary_date_checks() from public,anon,authenticated,service_role;

grant execute on function public.dictionary_date_checks() to "service_role";

revoke all on function public.legacy_mark_attendance(uuid,uuid) from public,anon,authenticated,service_role;

grant execute on function public.legacy_mark_attendance(uuid,uuid) to "service_role";

revoke all on function public.validate_dictionary_schedule() from public,anon,authenticated,service_role;

grant execute on function public.validate_dictionary_schedule() to "service_role";

revoke all on function public.validate_saved_card_dictionary() from public,anon,authenticated,service_role;

grant execute on function public.validate_saved_card_dictionary() to "service_role";

revoke all on function public.normalize_schedule_room() from public,anon,authenticated,service_role;

grant execute on function public.normalize_schedule_room() to "service_role";

revoke all on function public.write_compatible_schedule() from public,anon,authenticated,service_role;

grant execute on function public.write_compatible_schedule() to "service_role";

revoke all on function public.snapshot_fitness_target() from public,anon,authenticated,service_role;

grant execute on function public.snapshot_fitness_target() to "service_role";

revoke all on function public.settle_online_payment(uuid,text,text,numeric,text,boolean) from public,anon,authenticated,service_role;

grant execute on function public.settle_online_payment(uuid,text,text,numeric,text,boolean) to "service_role";

revoke all on function public.gym_action_v16(text,jsonb) from public,anon,authenticated,service_role;

grant execute on function public.gym_action_v16(text,jsonb) to "service_role";

revoke all on function public.gym_action(text,jsonb) from public,anon,authenticated,service_role;

grant execute on function public.gym_action(text,jsonb) to "authenticated";

grant execute on function public.gym_action(text,jsonb) to "service_role";

revoke all on function public.sync_staff_auth_profile() from public,anon,authenticated,service_role;

revoke all on function public.staff_profile_sync_ready() from public,anon,authenticated,service_role;

grant execute on function public.staff_profile_sync_ready() to "service_role";

revoke all on function public.register_profile() from public,anon,authenticated,service_role;

revoke all on function public.ensure_separate_account_identity() from public,anon,authenticated,service_role;

revoke all on function public.write_separate_profile() from public,anon,authenticated,service_role;

revoke all on function public.sync_trainer_name_snapshot() from public,anon,authenticated,service_role;

revoke all on function pulse_private.record_booking_attendance(uuid,text) from public,anon,authenticated,service_role;
