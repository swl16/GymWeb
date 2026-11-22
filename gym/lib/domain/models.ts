/** Shared database contracts. Passwords and full card credentials never belong in these records. */
export type Role = 'member' | 'staff' | 'trainer';
export interface Profile {
  id: string;
  username: string;
  name: string;
  gender: 'M' | 'F';
  date_of_birth: string | null;
  age: number | null;
  phone: string;
  email: string;
  role: Role;
  height?: number | null;
  weight?: number | null;
  weekly_target_minutes?: number | null;
  account_status?: 'Active' | 'Suspended';
}
export interface MembershipPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  benefits: string;
  archived: boolean;
  class_discount_percent?: number;
}
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
}
export interface ClassType {
  image_path?: string | null;
  id: string;
  name: string;
  fee: number;
  description: string;
  default_capacity: number;
  archived: boolean;
}
export interface ClassSchedule {
  current_booked?: number;
  class_id?: string;
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  trainer: string;
  trainer_id?: string | null;
  room: string;
  fee: number;
  capacity: number;
  status: string;
}
export interface Booking {
  id: string;
  user_id: string;
  schedule_id: string;
  booked_at: string;
  status: string;
  attended: boolean;
}
export interface Attendance {
  attendance_type?: 'Gym' | 'Class';
  id: string;
  user_id: string;
  booking_id?: string | null;
  check_in: string;
  check_out: string | null;
}
export interface Payment {
  id: string;
  user_id: string | null;
  subscription_id?: string | null;
  booking_id?: string | null;
  payment_type: string;
  method: string;
  amount: number;
  status: string;
  created_at: string;
  verified_at?: string | null;
  verified_by?: string | null;
  verified_by_name?: string | null;
  receipt_no: string;
  provider_session_id?: string | null;
  needs_review?: boolean;
  subtotal?: number;
  discount_amount?: number;
  discount_percent?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_plan_name?: string;
}
export interface FitnessLog {
  target_duration?: number | null;
  id: string;
  user_id: string;
  log_date: string;
  goal: string;
  duration: number;
  weight: number | null;
  height: number | null;
  bmi: number | null;
}
export interface SavedCard {
  id: string;
  user_id: string;
  holder: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}
export interface TrainerRecord {
  trainer_id: string;
  username: string;
  trainer_name: string;
  gender: 'M' | 'F';
  phone_no: string;
  email: string;
}
export interface StaffRecord {
  staff_id: string;
  username: string;
  staff_name: string;
  gender: 'M' | 'F';
  phone_no: string;
  email: string;
}
export interface BookingPass {
  booking_id: string;
  token: string;
  redeemed_at: string | null;
}
export interface DeletedMemberAccount {
  id: string;
  username: string;
  name: string;
  membership_type: 'Member' | 'Normal user';
  deleted_at: string;
}
export interface GymData {
  deleted_member_accounts?: DeletedMemberAccount[];
  is_admin?: boolean;
  class_types: ClassType[];
  profiles: Profile[];
  membership_plans: MembershipPlan[];
  user_subscriptions: Subscription[];
  class_schedules: ClassSchedule[];
  class_bookings: Booking[];
  gym_attendance: Attendance[];
  payments: Payment[];
  fitness_logs: FitnessLog[];
  saved_cards: SavedCard[];
  trainers: TrainerRecord[];
  staff: StaffRecord[];
  booking_passes?: BookingPass[];
  class_availability?: { schedule_id: string; reserved: number }[];
  class_roster?: {
    schedule_id: string;
    booking_id: string;
    member_id: string;
    member_name: string;
  }[];
}
export function emptyData(): GymData {
  return {
    class_types: [],
    profiles: [],
    membership_plans: [],
    user_subscriptions: [],
    class_schedules: [],
    class_bookings: [],
    gym_attendance: [],
    payments: [],
    fitness_logs: [],
    saved_cards: [],
    trainers: [],
    staff: [],
    booking_passes: [],
  };
}
