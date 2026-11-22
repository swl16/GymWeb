-- Auth lifecycle, per-table identity checks and workflow integrity.
-- Fresh Supabase project only. No accounts or business records are seeded.

CREATE TRIGGER retain_provider_payments BEFORE DELETE ON "Payment" FOR EACH ROW EXECUTE FUNCTION protect_provider_payment_history();

CREATE TRIGGER schedule_room_normalize BEFORE INSERT OR UPDATE ON "ClassSchedule" FOR EACH ROW EXECUTE FUNCTION normalize_schedule_room();

CREATE TRIGGER payment_cash_verifier BEFORE INSERT OR UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION snapshot_cash_verifier();

CREATE TRIGGER keep_member_deletion_record BEFORE DELETE ON "User" FOR EACH ROW EXECUTE FUNCTION record_deleted_member();

CREATE TRIGGER enforce_adult_member_registration BEFORE INSERT ON "User" FOR EACH ROW EXECUTE FUNCTION require_adult_member_registration();

CREATE TRIGGER attendance_type_snapshot BEFORE INSERT OR UPDATE ON "GymAttendance" FOR EACH ROW EXECUTE FUNCTION set_attendance_type();

CREATE TRIGGER fitness_target_snapshot BEFORE INSERT OR UPDATE ON "FitnessLog" FOR EACH ROW EXECUTE FUNCTION snapshot_fitness_target();

CREATE TRIGGER booking_count_sync AFTER INSERT OR DELETE OR UPDATE OF "workflowStatus", "scheduleID" ON "ClassBooking" FOR EACH ROW EXECUTE FUNCTION sync_current_booked();

CREATE TRIGGER booking_class_snapshot BEFORE INSERT OR UPDATE ON "ClassBooking" FOR EACH ROW EXECUTE FUNCTION snapshot_booking_class();

CREATE TRIGGER subscription_dictionary_status BEFORE INSERT OR UPDATE ON "UserSubscription" FOR EACH ROW EXECUTE FUNCTION subscription_dictionary_status();

CREATE TRIGGER membership_role_sync AFTER INSERT OR DELETE OR UPDATE ON "UserSubscription" FOR EACH ROW EXECUTE FUNCTION sync_dictionary_membership_role();

CREATE TRIGGER fitness_date_check BEFORE INSERT OR UPDATE ON "FitnessLog" FOR EACH ROW EXECUTE FUNCTION dictionary_date_checks();

CREATE TRIGGER attendance_date_check BEFORE INSERT OR UPDATE ON "GymAttendance" FOR EACH ROW EXECUTE FUNCTION dictionary_date_checks();

CREATE TRIGGER payment_date_check BEFORE INSERT OR UPDATE ON "Payment" FOR EACH ROW EXECUTE FUNCTION dictionary_date_checks();

CREATE TRIGGER dictionary_schedule BEFORE INSERT OR UPDATE ON "ClassSchedule" FOR EACH ROW EXECUTE FUNCTION validate_dictionary_schedule();

CREATE TRIGGER dictionary_saved_card BEFORE INSERT OR UPDATE ON "SavedCard" FOR EACH ROW EXECUTE FUNCTION validate_saved_card_dictionary();

CREATE TRIGGER compatible_schedule_writes INSTEAD OF INSERT OR DELETE OR UPDATE ON class_schedules FOR EACH ROW EXECUTE FUNCTION write_compatible_schedule();

CREATE TRIGGER profiles_separate_write INSTEAD OF UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION write_separate_profile();

CREATE TRIGGER unique_member_identity BEFORE INSERT OR UPDATE OF "userID", username ON "User" FOR EACH ROW EXECUTE FUNCTION ensure_separate_account_identity();

CREATE TRIGGER unique_staff_identity BEFORE INSERT OR UPDATE OF "staffID", username ON "Staff" FOR EACH ROW EXECUTE FUNCTION ensure_separate_account_identity();

CREATE TRIGGER unique_trainer_identity BEFORE INSERT OR UPDATE OF "trainerID", username ON "Trainer" FOR EACH ROW EXECUTE FUNCTION ensure_separate_account_identity();

CREATE TRIGGER trainer_name_snapshot AFTER UPDATE OF "trainerName" ON "Trainer" FOR EACH ROW EXECUTE FUNCTION sync_trainer_name_snapshot();

CREATE TRIGGER on_gym_registration AFTER INSERT OR UPDATE OF raw_app_meta_data, raw_user_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION register_profile();

CREATE TRIGGER on_staff_auth_profile_update AFTER UPDATE OF email, raw_user_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION sync_staff_auth_profile();
