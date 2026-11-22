-- Upgrade existing PULSE installations to independent account tables.
-- User contains members only. Staff and Trainer link directly to Supabase Auth.
lock table public."User", public."Staff", public."Trainer" in access exclusive mode;

do $$
begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='User' and column_name='accountRole') then
  if exists(select 1 from public."User" u where u."accountRole"='member' and
   (exists(select 1 from public."Staff" s where s."staffID"=u."userID") or exists(select 1 from public."Trainer" t where t."trainerID"=u."userID"))) then
   raise exception 'A member identity is also linked to Staff or Trainer. Resolve that conflict before upgrading';
  end if;
  if exists(select 1 from public."Staff" s join public."Trainer" t on s."staffID"=t."trainerID") then raise exception 'A shared Staff/Trainer identity must be resolved before upgrading';end if;
  if exists(select 1 from public."User" u where u."accountRole" in ('staff','trainer') and (
   exists(select 1 from public."UserSubscription" x where x."userID"=u."userID")
   or exists(select 1 from public."ClassBooking" x where x."userID"=u."userID")
   or exists(select 1 from public."GymAttendance" x where x."userID"=u."userID")
   or exists(select 1 from public."FitnessLog" x where x."userID"=u."userID")
   or exists(select 1 from public."Payment" x where x."userID"=u."userID")
   or exists(select 1 from public."SavedCard" x where x."userID"=u."userID")
   or exists(select 1 from public.payment_customers x where x.user_id=u."userID")
  )) then raise exception 'Staff/trainer identities have member-owned business records. Upgrade stopped to preserve those records';end if;
 end if;
end;
$$;

drop trigger if exists maintain_erd_identity on public."User";
alter table public."Staff" drop constraint if exists staff_staff_id_fkey;
alter table public."Trainer" drop constraint if exists trainers_trainer_id_fkey;
-- Idempotent foreign-key creation; no identity values are regenerated.
do $$begin
 if not exists(select 1 from pg_constraint where conrelid='public."Staff"'::regclass and conname='staff_auth_user_fk') then
  alter table public."Staff" add constraint staff_auth_user_fk foreign key("staffID") references auth.users(id) on delete cascade;
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public."Trainer"'::regclass and conname='trainer_auth_user_fk') then
  alter table public."Trainer" add constraint trainer_auth_user_fk foreign key("trainerID") references auth.users(id) on delete cascade;
 end if;
end;$$;

do $$begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='User' and column_name='accountRole') then
  insert into public."Staff"("staffID",username,"staffName",gender,"phoneNo",email)
   select "userID",username,name,gender,"phoneNo",email from public."User" where "accountRole"='staff'
   on conflict("staffID") do update set username=excluded.username,"staffName"=excluded."staffName",gender=excluded.gender,"phoneNo"=excluded."phoneNo",email=excluded.email;
  insert into public."Trainer"("trainerID",username,"trainerName",gender,"phoneNo",email)
   select "userID",username,name,gender,"phoneNo",email from public."User" where "accountRole"='trainer'
   on conflict("trainerID") do update set username=excluded.username,"trainerName"=excluded."trainerName",gender=excluded.gender,"phoneNo"=excluded."phoneNo",email=excluded.email;
  -- These are duplicate profile copies only; the guarded business records, Auth
  -- accounts, role-specific rows, class links and verifier links remain intact.
  delete from public."User" where "accountRole" in ('staff','trainer');
 end if;
end;$$;

-- Virtual compatibility projection only. No combined profile table is stored.
create or replace view public.profiles with(security_invoker=true) as
 select "userID" as id,username,name,gender,"dateOfBirth" as date_of_birth,age,
  "phoneNo" as phone,email,'member'::text as role,height,weight,"accountStatus" as account_status,"weeklyTargetMinutes" as weekly_target_minutes from public."User"
 union all
 select "staffID",username,"staffName",gender,null::date,null::integer,"phoneNo",email,'staff'::text,
  null::numeric(4,2),null::numeric(6,2),'Active'::text,null::integer from public."Staff"
 union all
 select "trainerID",username,"trainerName",gender,null::date,null::integer,"phoneNo",email,'trainer'::text,
  null::numeric(4,2),null::numeric(6,2),'Active'::text,null::integer from public."Trainer";

alter table public."User" drop constraint if exists member_birth_details;
alter table public."User" drop constraint if exists profiles_role_check;
alter table public."User" drop constraint if exists user_birth_dictionary;
alter table public."User" drop column if exists "accountRole";
alter table public."User" alter column "dateOfBirth" set not null;
alter table public."User" alter column age set not null;
alter table public."User" add constraint member_birth_details check("dateOfBirth" is not null and age is not null);
alter table public."User" add constraint user_birth_dictionary check("dateOfBirth" <= date '2008-12-31');
drop function if exists public.sync_erd_identity();

create or replace function public.profile_role() returns text language sql stable security definer set search_path='' as $$
 select case
  when exists(select 1 from public."Staff" where "staffID"=auth.uid()) then 'staff'
  when exists(select 1 from public."Trainer" where "trainerID"=auth.uid()) then 'trainer'
  when exists(select 1 from public."User" where "userID"=auth.uid() and "accountStatus"='Active') then 'member'
 end
$$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public."Staff" where "staffID"=auth.uid())
$$;
create or replace function public.require_adult_member_registration() returns trigger language plpgsql set search_path='' as $$
begin
 if NEW."dateOfBirth" is null or NEW."dateOfBirth">((now() at time zone 'Asia/Kuala_Lumpur')::date-interval '18 years')::date then
  raise exception 'You must be at least 18 years old to register.';
 end if;
 return new;
end;
$$;
create or replace function public.record_deleted_member() returns trigger language plpgsql set search_path='' as $$
begin
 insert into public.deleted_member_accounts(id,username,name,membership_type)
 values(OLD."userID",OLD.username,OLD.name,case when exists(
  select 1 from public.user_subscriptions s where s.user_id=OLD."userID" and s.status='Active'
   and s.start_date<=(now() at time zone 'Asia/Kuala_Lumpur')::date and s.end_date>(now() at time zone 'Asia/Kuala_Lumpur')::date
 ) then 'Member' else 'Normal user' end);
 return OLD;
end;
$$;
create or replace function public.register_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare p jsonb:=coalesce(new.raw_user_meta_data,'{}'::jsonb);
 kind text:=coalesce(new.raw_app_meta_data->>'role','member'); dob date;
begin
 if exists(select 1 from public."User" where "userID"=new.id)
  or exists(select 1 from public."Staff" where "staffID"=new.id)
  or exists(select 1 from public."Trainer" where "trainerID"=new.id) then return new;end if;
 if kind not in ('member','staff','trainer') then raise exception 'Invalid account role';end if;
 if kind='member' then
  dob:=nullif(p->>'date_of_birth','')::date;
  if dob is null then return new;end if;
 end if;
 if nullif(trim(p->>'username'),'') is null or nullif(trim(p->>'name'),'') is null
  or nullif(p->>'gender','') is null or nullif(p->>'phone','') is null or nullif(new.email,'') is null then return new;end if;
 if kind='staff' then
  insert into public."Staff"("staffID",username,"staffName",gender,"phoneNo",email)
   values(new.id,lower(p->>'username'),trim(p->>'name'),p->>'gender',p->>'phone',new.email);
 elsif kind='trainer' then
  insert into public."Trainer"("trainerID",username,"trainerName",gender,"phoneNo",email)
   values(new.id,lower(p->>'username'),trim(p->>'name'),p->>'gender',p->>'phone',new.email);
 else
  insert into public."User"("userID",username,name,gender,"dateOfBirth",age,"phoneNo",email,height,weight)
   values(new.id,lower(p->>'username'),trim(p->>'name'),p->>'gender',dob,
    extract(year from age((now() at time zone 'Asia/Kuala_Lumpur')::date,dob))::int,
    p->>'phone',new.email,nullif(p->>'height','')::numeric,nullif(p->>'weight','')::numeric);
 end if;
 return new;
end;
$$;
create or replace function public.sync_staff_auth_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare p jsonb:=coalesce(new.raw_user_meta_data,'{}'::jsonb);
begin
 update public."Staff" set username=lower(trim(coalesce(p->>'username',username))),
  "staffName"=trim(coalesce(p->>'name',"staffName")),gender=coalesce(p->>'gender',gender),
  "phoneNo"=coalesce(p->>'phone',"phoneNo"),email=new.email where "staffID"=new.id;
 update public."Trainer" set username=lower(trim(coalesce(p->>'username',username))),
  "trainerName"=trim(coalesce(p->>'name',"trainerName")),gender=coalesce(p->>'gender',gender),
  "phoneNo"=coalesce(p->>'phone',"phoneNo"),email=new.email where "trainerID"=new.id;
 return new;
end;
$$;
create or replace function public.ensure_separate_account_identity() returns trigger language plpgsql security definer set search_path='' as $$
declare uid uuid; duplicate_exists boolean;
begin
 uid:=case TG_TABLE_NAME when 'User' then (to_jsonb(NEW)->>'userID')::uuid when 'Staff' then (to_jsonb(NEW)->>'staffID')::uuid else (to_jsonb(NEW)->>'trainerID')::uuid end;
 NEW.username:=lower(NEW.username);
 -- One short transaction lock enforces cross-table uniqueness without a shared account table.
 perform pg_catalog.pg_advisory_xact_lock(2026112209);
 select exists(select 1 from public."User" u where (u.username=NEW.username or u."userID"=uid) and (TG_TABLE_NAME<>'User' or u."userID"<>uid))
  or exists(select 1 from public."Staff" s where (s.username=NEW.username or s."staffID"=uid) and (TG_TABLE_NAME<>'Staff' or s."staffID"<>uid))
  or exists(select 1 from public."Trainer" t where (t.username=NEW.username or t."trainerID"=uid) and (TG_TABLE_NAME<>'Trainer' or t."trainerID"<>uid)) into duplicate_exists;
 if duplicate_exists then raise exception 'Username or account identity is already registered' using errcode='23505';end if;
 return NEW;
end;
$$;
create or replace function public.write_separate_profile() returns trigger language plpgsql set search_path='' as $$
begin
 if NEW.id is distinct from OLD.id or NEW.role is distinct from OLD.role then raise exception 'Account identity and account type cannot be changed';end if;
 if OLD.role='staff' then
  update public."Staff" set username=NEW.username,"staffName"=NEW.name,gender=NEW.gender,"phoneNo"=NEW.phone,email=NEW.email where "staffID"=OLD.id;
 elsif OLD.role='trainer' then
  update public."Trainer" set username=NEW.username,"trainerName"=NEW.name,gender=NEW.gender,"phoneNo"=NEW.phone,email=NEW.email where "trainerID"=OLD.id;
 else
  update public."User" set username=NEW.username,name=NEW.name,gender=NEW.gender,"dateOfBirth"=NEW.date_of_birth,age=NEW.age,
   "phoneNo"=NEW.phone,email=NEW.email,height=NEW.height,weight=NEW.weight,"accountStatus"=NEW.account_status,"weeklyTargetMinutes"=NEW.weekly_target_minutes where "userID"=OLD.id;
 end if;
 return NEW;
end;
$$;
create or replace function public.sync_trainer_name_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if NEW."trainerName" is distinct from OLD."trainerName" then
  update public."ClassSchedule" set "trainerNameSnapshot"=NEW."trainerName" where "trainerID"=NEW."trainerID";
 end if;return NEW;
end;
$$;

CREATE OR REPLACE FUNCTION public.gym_action_v7(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare uid uuid:=auth.uid();plan membership_plans;start_day date;rid uuid;
begin
 if uid is null or not exists(select 1 from profiles where id=uid and account_status='Active') then raise exception 'Active sign-in required';end if;
 if action='subscribe' then
  if public.profile_role()<>'member' then raise exception 'Member access required';end if;
  -- Same member's concurrent renewals cannot choose the same expiry boundary.
  perform 1 from public."User" where "userID"=uid for update;
  if exists(select 1 from user_subscriptions where user_id=uid and status='Pending') then raise exception 'Complete or cancel your pending membership first';end if;
  select * into plan from membership_plans where id=(payload->>'plan_id')::uuid and not archived for share;
  if plan.id is null then raise exception 'Plan unavailable';end if;
  select greatest((now() at time zone 'Asia/Kuala_Lumpur')::date,coalesce(max(end_date),(now() at time zone 'Asia/Kuala_Lumpur')::date)) into start_day from user_subscriptions where user_id=uid and status='Active';
  insert into user_subscriptions(user_id,plan_id,start_date,end_date) values(uid,plan.id,start_day,(start_day+make_interval(months=>plan.duration_months))::date) returning id into rid;
  return jsonb_build_object('id',rid);
 elsif action='update_profile' and public.profile_role()<>'member' then
  payload:=payload-'height'-'weight';
 end if;
 return public.gym_action_v6(action,payload);
end $function$
;


create schema if not exists pulse_private;
revoke all on schema pulse_private from public, anon, authenticated;
CREATE OR REPLACE FUNCTION pulse_private.record_booking_attendance(booking uuid, direction text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare uid uuid:=auth.uid();b class_bookings;c class_schedules;v gym_attendance;open_visit gym_attendance;
begin
 if uid is null or not exists(select 1 from profiles where id=uid and account_status='Active') then raise exception 'Active sign-in required';end if;
 if direction not in ('in','out') or direction is null then raise exception 'Choose check in or check out';end if;
 select schedule_id into c.id from class_bookings where id=booking;
 select * into c from class_schedules where id=c.id for update;
 select * into b from class_bookings where id=booking for update;
 if b.id is null then raise exception 'Booking unavailable';end if;
 if not (b.user_id=uid or public.is_staff() or public.trains_class(b.schedule_id)) then raise exception 'Only the member, staff or assigned trainer can record attendance';end if;
 select * into v from gym_attendance where booking_id=b.id for update;
 if direction='out' then
  if v.id is null then raise exception 'Check in to this class before checking out';end if;
  if v.check_out is null then update gym_attendance set check_out=now() where id=v.id;end if;
  return jsonb_build_object('id',v.id,'message',case when v.check_out is null then 'Class check-out recorded' else 'Already checked out' end);
 end if;
 if b.status<>'Booked' or c.status<>'Active' then raise exception 'Only confirmed active class bookings can check in';end if;
 if v.id is not null then
  if v.check_out is not null then raise exception 'Attendance for this booking is already completed';end if;
  return jsonb_build_object('id',v.id,'message','Already checked in');
 end if;
 if now()<c.starts_at-interval '30 minutes' or now()>c.ends_at+interval '1 hour' then raise exception 'Check-in opens 30 minutes before class and closes one hour after it ends';end if;
 select * into open_visit from gym_attendance where user_id=b.user_id and check_out is null for update;
 if open_visit.id is not null then
  if open_visit.booking_id is not null then raise exception 'Check out of the current class before checking into another';end if;
  update gym_attendance set booking_id=b.id where id=open_visit.id returning * into v;
 else
  insert into gym_attendance(user_id,booking_id,check_in) values(b.user_id,b.id,now()) returning * into v;
 end if;
 update class_bookings set attended=true where id=b.id;
 return jsonb_build_object('id',v.id,'message','Class check-in recorded');
end $function$
;


drop trigger if exists profiles_separate_write on public.profiles;
create trigger profiles_separate_write instead of update on public.profiles for each row execute function public.write_separate_profile();
drop trigger if exists unique_member_identity on public."User";
drop trigger if exists unique_staff_identity on public."Staff";
drop trigger if exists unique_trainer_identity on public."Trainer";
create trigger unique_member_identity before insert or update of "userID",username on public."User" for each row execute function public.ensure_separate_account_identity();
create trigger unique_staff_identity before insert or update of "staffID",username on public."Staff" for each row execute function public.ensure_separate_account_identity();
create trigger unique_trainer_identity before insert or update of "trainerID",username on public."Trainer" for each row execute function public.ensure_separate_account_identity();
drop trigger if exists trainer_name_snapshot on public."Trainer";
create trigger trainer_name_snapshot after update of "trainerName" on public."Trainer" for each row execute function public.sync_trainer_name_snapshot();

drop policy if exists staff_deleted_directory on public.deleted_member_accounts;
create policy staff_deleted_directory on public.deleted_member_accounts for select to authenticated using(public.is_staff());
revoke insert,update,delete,truncate,references,trigger on public.profiles from anon,authenticated;
grant select on public.profiles,public."User",public."Staff",public."Trainer" to authenticated,service_role;
revoke all on function public.register_profile(),public.sync_staff_auth_profile(),public.ensure_separate_account_identity(),public.write_separate_profile(),public.sync_trainer_name_snapshot() from public,anon,authenticated,service_role;
revoke all on function pulse_private.record_booking_attendance(uuid,text) from public,anon,authenticated,service_role;
drop trigger if exists on_gym_registration on auth.users;
create trigger on_gym_registration after insert or update of raw_app_meta_data,raw_user_meta_data on auth.users for each row execute function public.register_profile();
drop trigger if exists on_staff_auth_profile_update on auth.users;
create trigger on_staff_auth_profile_update after update of email,raw_user_meta_data on auth.users for each row execute function public.sync_staff_auth_profile();
create or replace function public.staff_profile_sync_ready() returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from pg_catalog.pg_trigger t where t.tgrelid='auth.users'::regclass and t.tgname='on_staff_auth_profile_update' and t.tgenabled='O' and t.tgfoid='public.sync_staff_auth_profile()'::regprocedure);
$$;
revoke all on function public.staff_profile_sync_ready() from public,anon,authenticated;
grant execute on function public.staff_profile_sync_ready() to service_role;
notify pgrst,'reload schema';
