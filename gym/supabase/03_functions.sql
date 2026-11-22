-- Authorization, registration, checked transactions and identity integrity.
-- Fresh Supabase project only. No accounts or business records are seeded.

create schema if not exists pulse_private;

revoke all on schema pulse_private from public,anon,authenticated;

set check_function_bodies=false;

set search_path=public,extensions,pg_temp;

-- public.trains_class(uuid)
CREATE OR REPLACE FUNCTION public.trains_class(schedule uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$select coalesce(public.profile_role()='trainer' and exists(select 1 from class_schedules where id=schedule and trainer_id=auth.uid()),false)$function$
;

-- public.protect_provider_payment_history()
CREATE OR REPLACE FUNCTION public.protect_provider_payment_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin if old."providerSessionID" is not null then raise exception 'Provider-linked payments are retained for reconciliation';end if;return old;end $function$
;

-- public.profile_role()
CREATE OR REPLACE FUNCTION public.profile_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select case
  when exists(select 1 from public."Staff" where "staffID"=auth.uid()) then 'staff'
  when exists(select 1 from public."Trainer" where "trainerID"=auth.uid()) then 'trainer'
  when exists(select 1 from public."User" where "userID"=auth.uid() and "accountStatus"='Active') then 'member'
 end
$function$
;

-- public.class_roster()
CREATE OR REPLACE FUNCTION public.class_roster()
 RETURNS TABLE(schedule_id uuid, booking_id uuid, member_id uuid, member_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select b.schedule_id,b.id,b.user_id,p.name from class_bookings b join profiles p on p.id=b.user_id where public.is_staff() or public.trains_class(b.schedule_id)
$function$
;

-- public.class_availability()
CREATE OR REPLACE FUNCTION public.class_availability()
 RETURNS TABLE(schedule_id uuid, reserved bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select cs.id,count(bk.id) from class_schedules cs left join class_bookings bk on bk.schedule_id=cs.id and bk.status in ('Pending','Booked')
 where public.profile_role()<>'trainer' or cs.trainer_id=auth.uid() group by cs.id
$function$
;

-- public.invoice_quote_for(uuid,text,uuid)
CREATE OR REPLACE FUNCTION public.invoice_quote_for(member_id uuid, kind text, target_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare base numeric;discount_rate numeric:=0;discount numeric:=0;tax numeric;plan_name text:='';old_payment payments;
begin
 if kind='Membership' then
  select mp.price into base from user_subscriptions us join membership_plans mp on mp.id=us.plan_id where us.id=target_id and us.user_id=member_id;
  select * into old_payment from payments where subscription_id=target_id and status<>'Rejected';
 elsif kind='Class' then
  select cs.fee into base from class_bookings cb join class_schedules cs on cs.id=cb.schedule_id where cb.id=target_id and cb.user_id=member_id;
  select * into old_payment from payments where booking_id=target_id and status<>'Rejected';
  select mp.class_discount_percent,mp.name into discount_rate,plan_name from user_subscriptions us join membership_plans mp on mp.id=us.plan_id
  where us.user_id=member_id and us.status='Active' and us.start_date<=(now() at time zone 'Asia/Kuala_Lumpur')::date and us.end_date>(now() at time zone 'Asia/Kuala_Lumpur')::date
  order by mp.class_discount_percent desc,mp.id limit 1;
 else raise exception 'Choose membership or class';end if;
 if base is null then raise exception 'Invoice item unavailable';end if;
 if old_payment.id is not null then return jsonb_build_object('subtotal',old_payment.subtotal,'discount_percent',old_payment.discount_percent,'discount_amount',old_payment.discount_amount,'tax_rate',old_payment.tax_rate,'tax_amount',old_payment.tax_amount,'total',old_payment.amount,'discount_plan_name',old_payment.discount_plan_name);end if;
 discount_rate:=coalesce(discount_rate,0);discount:=round(base*discount_rate/100,2);tax:=round((base-discount)*0.06,2);
 return jsonb_build_object('subtotal',base,'discount_percent',discount_rate,'discount_amount',discount,'tax_rate',6,'tax_amount',tax,'total',base-discount+tax,'discount_plan_name',coalesce(plan_name,''));
end $function$
;

-- public.is_staff()
CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select exists(select 1 from public."Staff" where "staffID"=auth.uid())
$function$
;

-- public.invoice_quote(text,uuid)
CREATE OR REPLACE FUNCTION public.invoice_quote(kind text, target_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin if auth.uid() is null then raise exception 'Please sign in';end if;return public.invoice_quote_for(auth.uid(),kind,target_id);end $function$
;

-- public.issue_booking_pass(uuid)
CREATE OR REPLACE FUNCTION public.issue_booking_pass(booking uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare b class_bookings;pass booking_passes;
begin
 select * into b from class_bookings where id=booking and user_id=auth.uid();
 if b.id is null or b.status<>'Booked' then raise exception 'Only your confirmed booking has a check-in pass';end if;
 insert into booking_passes(booking_id) values(b.id) on conflict do nothing;
 select * into pass from booking_passes where booking_id=b.id;
 return jsonb_build_object('token',pass.token,'redeemed_at',pass.redeemed_at);
end $function$
;

-- public.require_adult_member_registration()
CREATE OR REPLACE FUNCTION public.require_adult_member_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if NEW."dateOfBirth" is null or NEW."dateOfBirth">((now() at time zone 'Asia/Kuala_Lumpur')::date-interval '18 years')::date then
  raise exception 'You must be at least 18 years old to register.';
 end if;
 return new;
end;
$function$
;

-- public.redeem_booking_attendance(uuid,text)
CREATE OR REPLACE FUNCTION public.redeem_booking_attendance(pass_token uuid, direction text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare booking uuid;result jsonb;
begin
 select booking_id into booking from booking_passes where token=pass_token;
 if booking is null then raise exception 'Invalid attendance pass';end if;
 result:=pulse_private.record_booking_attendance(booking,direction);
 if direction='in' then update booking_passes set redeemed_at=coalesce(redeemed_at,now()) where booking_id=booking;end if;
 return result;
end $function$
;

-- public.redeem_booking_pass(uuid)
CREATE OR REPLACE FUNCTION public.redeem_booking_pass(pass_token uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$select public.redeem_booking_attendance(pass_token,'in')$function$
;

-- public.gym_action_v6(text,jsonb)
CREATE OR REPLACE FUNCTION public.gym_action_v6(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare uid uuid:=auth.uid();s user_subscriptions;b class_bookings;c class_schedules;
begin
 if uid is null or not exists(select 1 from profiles where id=uid and account_status='Active') then raise exception 'Active sign-in required';end if;
 if action='booking_attendance' then return pulse_private.record_booking_attendance((payload->>'id')::uuid,payload->>'direction');
 elsif action='mark_attendance' then return pulse_private.record_booking_attendance((payload->>'id')::uuid,'in');
 elsif action='cancel_subscription' then
  if public.profile_role()<>'member' or coalesce((payload->>'confirm')::boolean,false) is not true then raise exception 'Member confirmation required';end if;
  select * into s from user_subscriptions where id=(payload->>'id')::uuid and user_id=uid for update;
  if s.id is null then raise exception 'Subscription unavailable';end if;
  if s.status='Cancelled' then return jsonb_build_object('id',s.id);end if;
  if s.status not in ('Pending','Rejected') or exists(select 1 from payments where subscription_id=s.id and status='Verified') then raise exception 'Only unpaid pending or rejected memberships can be cancelled';end if;
  update user_subscriptions set status='Cancelled',cancelled_at=now() where id=s.id;
  update payments set status='Rejected' where subscription_id=s.id and status='Pending';
  return jsonb_build_object('id',s.id);
 elsif action='cancel_booking' then
  if public.profile_role()<>'member' or coalesce((payload->>'confirm')::boolean,false) is not true then raise exception 'Member confirmation required';end if;
  select schedule_id into c.id from class_bookings where id=(payload->>'id')::uuid and user_id=uid;
  select * into c from class_schedules where id=c.id for update;
  select * into b from class_bookings where id=(payload->>'id')::uuid and user_id=uid for update;
  if b.id is null then raise exception 'Booking unavailable';end if;
  if b.status='Cancelled' then return jsonb_build_object('id',b.id);end if;
  if b.status not in ('Booked','Pending') or b.attended then raise exception 'This booking cannot be cancelled';end if;
  if b.status='Booked' and c.starts_at<now()+interval '24 hours' then raise exception 'Confirmed bookings need at least 24 hours notice';end if;
  if b.status='Pending' and c.starts_at<=now() then raise exception 'The session has already started';end if;
  update class_bookings set status='Cancelled',cancelled_at=now() where id=b.id;
  update payments set status='Rejected' where booking_id=b.id and status='Pending';
  return jsonb_build_object('id',b.id);
 end if;
 return public.gym_action_v5(action,payload);
end $function$
;

-- public.gym_action_v7(text,jsonb)
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

-- public.gym_action_v9(text,jsonb)
CREATE OR REPLACE FUNCTION public.gym_action_v9(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare uid uuid:=auth.uid(); rid uuid; w numeric; h numeric; minutes numeric; g text;
begin
 if uid is null or not exists(select 1 from profiles where id=uid and account_status='Active') then raise exception 'Active sign-in required';end if;
 if action in ('set_measurements','set_weekly_target','delete_fitness','save_fitness') then
  if public.profile_role()<>'member' then raise exception 'Member access required';end if;
  if action='set_measurements' then
   w:=nullif(payload->>'weight','')::numeric; h:=nullif(payload->>'height','')::numeric;
   if w is null or w<=0 or w>300 then raise exception 'Weight must be greater than 0 and at most 300 kg';end if;
   if h is null or h<=0 or h>2.5 then raise exception 'Height must be greater than 0 and at most 2.5 meters';end if;
   update profiles set weight=w,height=h where id=uid returning id into rid;
  elsif action='set_weekly_target' then
   minutes:=nullif(payload->>'weekly_target_minutes','')::numeric;
   if minutes is null or minutes<1 or minutes>10080 or trunc(minutes)<>minutes then raise exception 'Weekly target must be a whole number from 1 to 10080 minutes';end if;
   update profiles set weekly_target_minutes=minutes::integer where id=uid returning id into rid;
  elsif action='delete_fitness' then
   if coalesce((payload->>'confirm')::boolean,false) is not true then raise exception 'Confirmation required';end if;
   delete from fitness_logs where id=(payload->>'id')::uuid and user_id=uid returning id into rid;
   if rid is null then raise exception 'Fitness log unavailable';end if;
  else
   g:=trim(payload->>'goal'); minutes:=nullif(payload->>'duration','')::numeric;
   if g is null or length(g)=0 then raise exception 'Enter your fitness goal';end if;
   if minutes is null or minutes<0 or minutes>1440 or trunc(minutes)<>minutes then raise exception 'Workout duration must be a whole number from 0 to 1440 minutes';end if;
   if nullif(payload->>'id','') is null then
    select weight,height into w,h from profiles where id=uid;
    insert into fitness_logs(user_id,goal,duration,weight,height) values(uid,g,minutes::integer,w,h) returning id into rid;
   else
    update fitness_logs set goal=g,duration=minutes::integer where id=(payload->>'id')::uuid and user_id=uid returning id into rid;
    if rid is null then raise exception 'Fitness log unavailable';end if;
   end if;
  end if;
  return jsonb_build_object('id',rid);
 end if;
 return public.gym_action_v7(action,payload);
end $function$
;

-- public.snapshot_cash_verifier()
CREATE OR REPLACE FUNCTION public.snapshot_cash_verifier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if TG_OP='UPDATE' and OLD."paymentMethod"='Cash' and OLD."workflowStatus"='Verified' then
   NEW."verifiedByName" := OLD."verifiedByName";
 elsif NEW."paymentMethod"='Cash' and NEW."workflowStatus"='Verified' then
   if auth.uid() is null or NEW."staffID" is distinct from auth.uid() then
     raise exception 'Cash verification requires the approving staff account';
   end if;
   select p.name into NEW."verifiedByName" from public.profiles p
    where p.id=auth.uid() and p.role='staff' and p.account_status='Active';
   if NEW."verifiedByName" is null then raise exception 'Active staff access required';end if;
 else NEW."verifiedByName" := null;
 end if;
 return NEW;
end $function$
;

-- public.record_deleted_member()
CREATE OR REPLACE FUNCTION public.record_deleted_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 insert into public.deleted_member_accounts(id,username,name,membership_type)
 values(OLD."userID",OLD.username,OLD.name,case when exists(
  select 1 from public.user_subscriptions s where s.user_id=OLD."userID" and s.status='Active'
   and s.start_date<=(now() at time zone 'Asia/Kuala_Lumpur')::date and s.end_date>(now() at time zone 'Asia/Kuala_Lumpur')::date
 ) then 'Member' else 'Normal user' end);
 return OLD;
end;
$function$
;

-- public.gym_action_v11(text,jsonb)
CREATE OR REPLACE FUNCTION public.gym_action_v11(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare room_number text; start_ts timestamptz; end_ts timestamptz; edited_id uuid;
begin
 if action='save_class' then
  if not public.is_staff() then raise exception 'Staff access required';end if;
  if coalesce(payload->>'room','') !~ '^([1-9]|10)$' then raise exception 'Select a room from 1 to 10';end if;
  room_number:=payload->>'room';start_ts:=(payload->>'starts_at')::timestamptz;end_ts:=(payload->>'ends_at')::timestamptz;
  edited_id:=nullif(payload->>'id','')::uuid;
  if payload->>'status'='Active' and start_ts<end_ts then
   if exists(select 1 from class_schedules c where (edited_id is null or c.id<>edited_id) and c.status='Active' and c.room=room_number and c.starts_at<end_ts and c.ends_at>start_ts) then
    raise exception 'Clashing class: Room % is already scheduled during this time. Choose another room or time.',room_number;
   end if;
   if exists(select 1 from class_schedules c where (edited_id is null or c.id<>edited_id) and c.status='Active' and c.trainer_id=(payload->>'trainer_id')::uuid and c.starts_at<end_ts and c.ends_at>start_ts) then
    raise exception 'Clashing class: This trainer is already assigned during this time. Choose another trainer or time.';
   end if;
  end if;
 end if;
 return public.gym_action_v9(action,payload);
end $function$
;

-- public.sync_current_booked()
CREATE OR REPLACE FUNCTION public.sync_current_booked()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare old_id uuid; new_id uuid; old_slot integer:=0; new_slot integer:=0;
begin
 if TG_OP<>'INSERT' then
  old_id:=OLD."scheduleID"; old_slot:=case when OLD."workflowStatus" in ('Pending','Booked') then 1 else 0 end;
 end if;
 if TG_OP<>'DELETE' then
  new_id:=NEW."scheduleID"; new_slot:=case when NEW."workflowStatus" in ('Pending','Booked') then 1 else 0 end;
 end if;
 perform id from public.class_schedules where id in (old_id,new_id) order by id for update;
 if old_id is not distinct from new_id then
  update public.class_schedules set current_booked=current_booked+new_slot-old_slot where id=new_id;
 else
  update public.class_schedules set current_booked=current_booked-old_slot where id=old_id;
  update public.class_schedules set current_booked=current_booked+new_slot where id=new_id;
 end if;
 return null;
end $function$
;

-- public.refresh_membership_dictionary()
CREATE OR REPLACE FUNCTION public.refresh_membership_dictionary()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null then raise exception 'Sign-in required';end if;
 update public."UserSubscription" set status=status where "userID"=auth.uid() or public.is_staff();
 update public."User" u set role=case when exists(select 1 from public."UserSubscription" s where s."userID"=u."userID" and s."workflowStatus"='Active' and s."startDate"<=(now() at time zone 'Asia/Kuala_Lumpur')::date and s."expiryDate">(now() at time zone 'Asia/Kuala_Lumpur')::date) then 'Member' else 'Normal user' end where u."userID"=auth.uid() or public.is_staff();
end $function$
;

-- public.sync_dictionary_membership_role()
CREATE OR REPLACE FUNCTION public.sync_dictionary_membership_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid;
begin uid:=case when TG_OP='DELETE' then OLD."userID" else NEW."userID" end;
 update public."User" u set role=case when exists(select 1 from public."UserSubscription" s where s."userID"=uid and s."workflowStatus"='Active' and s."startDate"<=(now() at time zone 'Asia/Kuala_Lumpur')::date and s."expiryDate">(now() at time zone 'Asia/Kuala_Lumpur')::date) then 'Member' else 'Normal user' end where u."userID"=uid;return null;end $function$
;

-- public.begin_online_payment(text,uuid)
CREATE OR REPLACE FUNCTION public.begin_online_payment(kind text, target_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare uid uuid:=auth.uid();s user_subscriptions;b class_bookings;c class_schedules;p payments;cost numeric;quote jsonb;
begin
 if uid is null or public.profile_role()<>'member' then raise exception 'Member sign-in required';end if;
 if kind='Membership' then
  select * into s from user_subscriptions where id=target_id and user_id=uid for update;
  if s.id is null or s.status not in ('Pending','Rejected') then raise exception 'Subscription unavailable';end if;
  select price into cost from membership_plans where id=s.plan_id;
  select * into p from payments where subscription_id=s.id and status<>'Rejected';
 elsif kind='Class' then
  select schedule_id into c.id from class_bookings where id=target_id and user_id=uid;
  select * into c from class_schedules where id=c.id for update;
  select * into b from class_bookings where id=target_id and user_id=uid for update;
  if b.id is null or b.status<>'Pending' or c.status<>'Active' or c.starts_at<=now() then raise exception 'Booking unavailable';end if;
  cost:=c.fee;
  select * into p from payments where booking_id=b.id and status<>'Rejected';
 else raise exception 'Choose membership or class';end if;
 if p.id is not null then
  if p.status='Pending' and p.method in ('Card','E-wallet') then return to_jsonb(p);end if;
  raise exception 'A payment already exists for this item';
 end if;
 quote:=public.invoice_quote_for(uid,kind,target_id);
 insert into payments(user_id,subscription_id,booking_id,payment_type,method,amount,subtotal,discount_percent,discount_amount,tax_rate,tax_amount,discount_plan_name) values(uid,s.id,b.id,kind,'Card',(quote->>'total')::numeric,(quote->>'subtotal')::numeric,(quote->>'discount_percent')::numeric,(quote->>'discount_amount')::numeric,6,(quote->>'tax_amount')::numeric,quote->>'discount_plan_name') returning * into p;
 return to_jsonb(p);
end $function$
;

-- public.gym_action_v5(text,jsonb)
CREATE OR REPLACE FUNCTION public.gym_action_v5(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare uid uuid:=auth.uid(); staff boolean:=public.is_staff(); rid uuid; p membership_plans; c class_schedules;
 b class_bookings; sub user_subscriptions; pay payments; amount numeric; target uuid; result jsonb; quote jsonb;
 start_day date; start_ts timestamptz; end_ts timestamptz; count_booked integer;
begin
 if uid is null then raise exception 'Please sign in';end if;
 if not exists(select 1 from profiles where id=uid and account_status='Active') then raise exception 'Active account required';end if;
 if action in ('subscribe','book','pay','save_fitness','reset_fitness','check_in','check_out') and exists(select 1 from profiles where id=uid and role<>'member') then raise exception 'Member access required';end if;
 if public.profile_role()='trainer' and action not in ('update_profile','mark_attendance') then raise exception 'This action is not available to trainers';end if;
 if action in ('save_plan','delete_plan','save_class','delete_class','verify_payment','delete_payment','save_class_type') and not staff then raise exception 'Staff access required';end if;
 if action='update_profile' then
  if (payload->>'date_of_birth')::date>(now() at time zone 'Asia/Kuala_Lumpur')::date then raise exception 'Enter a valid date of birth';end if;
  update profiles set name=trim(payload->>'name'),age=extract(year from age((now() at time zone 'Asia/Kuala_Lumpur')::date,(payload->>'date_of_birth')::date))::int,height=nullif(payload->>'height','')::numeric,weight=nullif(payload->>'weight','')::numeric,date_of_birth=(payload->>'date_of_birth')::date,phone=payload->>'phone',email=payload->>'email' where id=uid;
  -- Keep login email synchronized atomically. Auth email verification is not changed here.
  -- Email is contact information; login resolves the Auth email separately in the API.
 elsif action='save_class_type' then
  if nullif(payload->>'id','') is null then
   insert into class_types(name,fee,description,default_capacity) values(trim(payload->>'name'),(payload->>'fee')::numeric,trim(payload->>'description'),(payload->>'default_capacity')::int) returning id into rid;
  else
   update class_types set name=trim(payload->>'name'),fee=(payload->>'fee')::numeric,description=trim(payload->>'description'),default_capacity=(payload->>'default_capacity')::int where id=(payload->>'id')::uuid returning id into rid;
   if not found then raise exception 'Class type not found';end if;
  end if;
 elsif action='save_plan' then
  if nullif(payload->>'id','') is null then
   insert into membership_plans(name,duration_months,price,benefits,class_discount_percent) values(trim(payload->>'name'),(payload->>'duration_months')::int,(payload->>'price')::numeric,trim(payload->>'benefits'),coalesce((payload->>'class_discount_percent')::numeric,0)) returning id into rid;
  else update membership_plans set name=trim(payload->>'name'),duration_months=(payload->>'duration_months')::int,price=(payload->>'price')::numeric,benefits=trim(payload->>'benefits'),class_discount_percent=coalesce((payload->>'class_discount_percent')::numeric,0) where id=(payload->>'id')::uuid returning id into rid;end if;
 elsif action='delete_plan' then
  if coalesce((payload->>'confirm')::boolean,false) is not true then raise exception 'Confirmation required';end if;
  -- Archive referenced plans so subscription/payment history remains valid.
  update membership_plans set archived=true where id=(payload->>'id')::uuid;
 elsif action='subscribe' then
  select * into p from membership_plans where id=(payload->>'plan_id')::uuid and not archived for share;
  if not found then raise exception 'Plan unavailable';end if;
  start_day:=(now() at time zone 'Asia/Kuala_Lumpur')::date;
  insert into user_subscriptions(user_id,plan_id,start_date,end_date) values(uid,p.id,start_day,(start_day+make_interval(months=>p.duration_months))::date) returning id into rid;
 elsif action='save_class' then
  if not exists(select 1 from class_types where id=nullif(payload->>'class_id','')::uuid and not archived) then raise exception 'Select an available class type';end if;
  if not exists(select 1 from trainers where trainer_id=nullif(payload->>'trainer_id','')::uuid) then raise exception 'Select an assigned trainer';end if;
  payload:=payload||jsonb_build_object('name',(select name from class_types where id=(payload->>'class_id')::uuid));
  if nullif(payload->>'trainer_id','') is not null then
   if not exists(select 1 from profiles where id=(payload->>'trainer_id')::uuid and role='trainer') then raise exception 'Select a valid trainer account';end if;
   payload:=payload||jsonb_build_object('trainer',(select name from profiles where id=(payload->>'trainer_id')::uuid));
  end if;

  start_ts:=(payload->>'starts_at')::timestamptz; end_ts:=(payload->>'ends_at')::timestamptz;
  if start_ts<now() then raise exception 'Class cannot start in the past';end if;
  if nullif(payload->>'id','') is null then
   insert into class_schedules(class_id,name,starts_at,ends_at,trainer,trainer_id,room,fee,capacity,status) values((payload->>'class_id')::uuid,trim(payload->>'name'),start_ts,end_ts,trim(payload->>'trainer'),nullif(payload->>'trainer_id','')::uuid,trim(payload->>'room'),(payload->>'fee')::numeric,(payload->>'capacity')::int,payload->>'status') returning id into rid;
  else
   rid:=(payload->>'id')::uuid;select * into c from class_schedules where id=rid for update;
   select count(*) into count_booked from class_bookings where schedule_id=rid and status in ('Pending','Booked');
   if (payload->>'capacity')::int<count_booked then raise exception 'Capacity cannot be lower than reserved slots';end if;
   update class_schedules set class_id=(payload->>'class_id')::uuid,name=trim(payload->>'name'),starts_at=start_ts,ends_at=end_ts,trainer=trim(payload->>'trainer'),trainer_id=nullif(payload->>'trainer_id','')::uuid,room=trim(payload->>'room'),fee=(payload->>'fee')::numeric,capacity=(payload->>'capacity')::int,status=payload->>'status' where id=rid;
   if payload->>'status'='Cancelled' then update class_bookings set status='Cancelled' where schedule_id=rid and status in ('Pending','Booked');update payments set status='Rejected' where booking_id in(select id from class_bookings where schedule_id=rid) and status='Pending';end if;
  end if;
 elsif action='delete_class' then
  rid:=(payload->>'id')::uuid;select * into c from class_schedules where id=rid for update;
  if c.status<>'Cancelled' or coalesce((payload->>'confirm')::boolean,false) is not true then raise exception 'Only confirmed cancelled schedules can be deleted';end if;
  -- Preserve receipts; cancelled booking links become null on payment.
  delete from class_bookings where schedule_id=rid;delete from class_schedules where id=rid;
 elsif action='book' then
  select * into c from class_schedules where id=(payload->>'schedule_id')::uuid for update;
  if not found or c.status<>'Active' or c.starts_at<=now() then raise exception 'Class unavailable';end if;
  select count(*) into count_booked from class_bookings where schedule_id=c.id and status in ('Pending','Booked');
  if count_booked>=c.capacity then raise exception 'This class is full';end if;
  if exists(select 1 from class_bookings where schedule_id=c.id and user_id=uid and status in ('Pending','Booked')) then raise exception 'You already booked this class';end if;
  insert into class_bookings(user_id,schedule_id,status) values(uid,c.id,case when c.fee=0 then 'Booked' else 'Pending' end) returning id into rid;
 elsif action='cancel_booking' then
  -- Lock schedule before booking, matching book/payment lock order.
  select schedule_id into target from class_bookings where id=(payload->>'id')::uuid and user_id=uid;
  select * into c from class_schedules where id=target for update;
  select * into b from class_bookings where id=(payload->>'id')::uuid and user_id=uid for update;
  if b.id is null or b.status not in ('Pending','Booked') then raise exception 'Booking unavailable';end if;
  if c.starts_at<now()+interval '24 hours' then raise exception 'Cancel at least 24 hours before class';end if;
  update class_bookings set status='Cancelled' where id=b.id;
  update payments set status='Rejected' where booking_id=b.id and status='Pending';
 elsif action='pay' then
  if payload->>'method' not in ('Cash','Card','E-wallet') then raise exception 'Select a payment method';end if;
  if payload->>'method'<>'Cash' then raise exception 'Online payment provider is not configured. Choose cash at the front desk.';end if;
  if payload->>'payment_type'='Membership' then
   select * into sub from user_subscriptions where id=(payload->>'target_id')::uuid and user_id=uid for update;
   if sub.id is null or sub.status not in ('Pending','Rejected') then raise exception 'Subscription unavailable';end if;
   quote:=public.invoice_quote_for(uid,'Membership',sub.id);amount:=(quote->>'total')::numeric;
   insert into payments(user_id,subscription_id,payment_type,method,amount,subtotal,discount_percent,discount_amount,tax_rate,tax_amount,discount_plan_name) values(uid,sub.id,'Membership','Cash',amount,(quote->>'subtotal')::numeric,(quote->>'discount_percent')::numeric,(quote->>'discount_amount')::numeric,6,(quote->>'tax_amount')::numeric,quote->>'discount_plan_name') returning id into rid;
  elsif payload->>'payment_type'='Class' then
   select schedule_id into target from class_bookings where id=(payload->>'target_id')::uuid and user_id=uid;
   select * into c from class_schedules where id=target for update;
   select * into b from class_bookings where id=(payload->>'target_id')::uuid and user_id=uid for update;
   if b.id is null or b.status<>'Pending' or c.status<>'Active' or c.starts_at<=now() then raise exception 'Booking unavailable';end if;
   quote:=public.invoice_quote_for(uid,'Class',b.id);
   insert into payments(user_id,booking_id,payment_type,method,amount,subtotal,discount_percent,discount_amount,tax_rate,tax_amount,discount_plan_name) values(uid,b.id,'Class','Cash',(quote->>'total')::numeric,(quote->>'subtotal')::numeric,(quote->>'discount_percent')::numeric,(quote->>'discount_amount')::numeric,6,(quote->>'tax_amount')::numeric,quote->>'discount_plan_name') returning id into rid;
  else raise exception 'Select membership or class payment';end if;
 elsif action='verify_payment' then
  select * into pay from payments where id=(payload->>'id')::uuid;
  if pay.booking_id is not null then select schedule_id into target from class_bookings where id=pay.booking_id;perform 1 from class_schedules where id=target for update;perform 1 from class_bookings where id=pay.booking_id for update;end if;
  if pay.subscription_id is not null then perform 1 from user_subscriptions where id=pay.subscription_id for update;end if;
  select * into pay from payments where id=(payload->>'id')::uuid for update;
  if pay.id is null or pay.status<>'Pending' or pay.method<>'Cash' then raise exception 'Only pending cash payments can be reviewed';end if;
  if payload->>'status' not in ('Verified','Rejected') then raise exception 'Choose Verified or Rejected';end if;
  if pay.booking_id is not null and not exists(select 1 from class_bookings bk join class_schedules cs on cs.id=bk.schedule_id where bk.id=pay.booking_id and bk.status='Pending' and cs.status='Active' and cs.starts_at>now()) then raise exception 'Booking is no longer eligible';end if;
  update payments set status=payload->>'status',verified_at=case when payload->>'status'='Verified' then now() else null end,verified_by=uid where id=pay.id;
  if pay.subscription_id is not null then update user_subscriptions set status=case when payload->>'status'='Verified' then case when end_date<=(now() at time zone 'Asia/Kuala_Lumpur')::date then 'Expired' else 'Active' end else 'Rejected' end where id=pay.subscription_id;end if;
  if pay.booking_id is not null then update class_bookings set status=case when payload->>'status'='Verified' then 'Booked' else 'Rejected' end where id=pay.booking_id;end if;
 elsif action='delete_payment' then
  if coalesce((payload->>'confirm')::boolean,false) is not true then raise exception 'Confirmation required';end if;
  delete from payments where id=(payload->>'id')::uuid and status='Rejected';if not found then raise exception 'Only rejected payments may be deleted';end if;
 elsif action='check_in' then
  insert into gym_attendance(user_id) values(uid) returning id into rid;
 elsif action='check_out' then
  update gym_attendance set check_out=now() where user_id=uid and check_out is null returning id into rid;
  if rid is null then raise exception 'Check in first';end if;
 elsif action='mark_attendance' then
  select * into b from class_bookings where id=(payload->>'id')::uuid for update;
  select * into c from class_schedules where id=b.schedule_id;
  if not staff and not coalesce((public.profile_role()='trainer' and c.trainer_id=uid),false) then raise exception 'Only assigned trainers or staff can record attendance';end if;
  if b.status<>'Booked' or c.status<>'Active' then raise exception 'Only booked active classes can record attendance';end if;
  if now()<c.starts_at-interval '30 minutes' or now()>c.ends_at+interval '1 hour' then raise exception 'Attendance opens 30 minutes before class and closes one hour after';end if;
  if not b.attended then update class_bookings set attended=true where id=b.id;perform public.legacy_mark_attendance(b.user_id,b.id);end if;
 elsif action='save_fitness' then
  if nullif(payload->>'id','') is null then
   insert into fitness_logs(user_id,goal,duration,weight,height) values(uid,trim(payload->>'goal'),(payload->>'duration')::int,(payload->>'weight')::numeric,(payload->>'height')::numeric) returning id into rid;
  else update fitness_logs set goal=trim(payload->>'goal'),duration=(payload->>'duration')::int,weight=(payload->>'weight')::numeric,height=(payload->>'height')::numeric where id=(payload->>'id')::uuid and user_id=uid returning id into rid;end if;
 elsif action='reset_fitness' then
  if coalesce((payload->>'confirm')::boolean,false) is not true then raise exception 'Confirmation required';end if;
  update fitness_logs set duration=0 where id=(payload->>'id')::uuid and user_id=uid;
 else raise exception 'Unknown operation';end if;
 return jsonb_build_object('id',rid);
exception when exclusion_violation then raise exception 'Clashing class: room or trainer already has a schedule during this time';
when unique_violation then raise exception 'This record already exists (duplicate booking, payment, username or open visit)';
end $function$
;

-- public.snapshot_booking_class()
CREATE OR REPLACE FUNCTION public.snapshot_booking_class()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if TG_OP='INSERT' then select t."className" into NEW."classBooking" from public."ClassSchedule" s join public."ClassType" t on t."classID"=s."classID" where s."scheduleID"=NEW."scheduleID";
 elsif NEW."scheduleID" is distinct from OLD."scheduleID" then select t."className" into NEW."classBooking" from public."ClassSchedule" s join public."ClassType" t on t."classID"=s."classID" where s."scheduleID"=NEW."scheduleID";
 else NEW."classBooking":=OLD."classBooking";end if;return NEW;
end $function$
;

-- public.subscription_dictionary_status()
CREATE OR REPLACE FUNCTION public.subscription_dictionary_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare today date:=(now() at time zone 'Asia/Kuala_Lumpur')::date;
begin NEW.status:=case when NEW."workflowStatus" in ('Expired','Rejected','Cancelled') or NEW."expiryDate"<=today then 'Expired' when NEW."workflowStatus"='Active' and NEW."startDate"<=today then 'Active' else 'Scheduled' end;return NEW;end $function$
;

-- public.set_attendance_type()
CREATE OR REPLACE FUNCTION public.set_attendance_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin if TG_OP='INSERT' then NEW."attendanceType":=case when NEW."bookingID" is null then 'Gym visit' else 'Class' end;else NEW."attendanceType":=case when OLD."attendanceType"='Gym' then 'Gym visit' else OLD."attendanceType" end;end if;return NEW;end $function$
;

-- public.dictionary_date_checks()
CREATE OR REPLACE FUNCTION public.dictionary_date_checks()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare today date:=(now() at time zone 'Asia/Kuala_Lumpur')::date;
begin
 if TG_TABLE_NAME='FitnessLog' then if NEW."logDate">today then raise exception 'Log date cannot be in the future';end if;
 elsif TG_TABLE_NAME='GymAttendance' then if (NEW."checkedInAt" at time zone 'Asia/Kuala_Lumpur')::date>today then raise exception 'Attendance date cannot be in the future';end if;
 elsif TG_TABLE_NAME='Payment' then if (NEW."submittedAt" at time zone 'Asia/Kuala_Lumpur')::date>today then raise exception 'Payment date cannot be in the future';end if;if NEW."workflowStatus"='Verified' and NEW."verifiedAt" is null then raise exception 'Verified date is required after verification';end if;end if;return NEW;
end $function$
;

-- public.legacy_mark_attendance(uuid,uuid)
CREATE OR REPLACE FUNCTION public.legacy_mark_attendance(uid uuid, bid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not public.is_staff() and not exists(select 1 from public."ClassBooking" b join public."ClassSchedule" s on s."scheduleID"=b."scheduleID" where b."bookingID"=bid and s."trainerID"=auth.uid()) then raise exception 'Staff or assigned trainer required';end if;
 insert into public."GymAttendance"("userID","bookingID","checkedInAt") values(uid,bid,now()) on conflict("userID") where("checkedOutAt" is null) do update set "bookingID"=excluded."bookingID";end $function$
;

-- public.validate_dictionary_schedule()
CREATE OR REPLACE FUNCTION public.validate_dictionary_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if TG_OP='INSERT' then if (NEW."startsAt" at time zone 'Asia/Kuala_Lumpur')::date<(now() at time zone 'Asia/Kuala_Lumpur')::date then raise exception 'Schedule date cannot be in the past';end if;
 elsif NEW."startsAt" is distinct from OLD."startsAt" and NEW."startsAt"<now() then raise exception 'Schedule date cannot be in the past';end if;
 if (NEW."startsAt" at time zone 'Asia/Kuala_Lumpur')::date<>(NEW."endsAt" at time zone 'Asia/Kuala_Lumpur')::date or NEW."endsAt"<=NEW."startsAt" then raise exception 'End time must be later on the same schedule date';end if;return NEW;end $function$
;

-- public.validate_saved_card_dictionary()
CREATE OR REPLACE FUNCTION public.validate_saved_card_dictionary()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if length(trim(NEW."cardHolderName")) not between 1 and 100 then raise exception 'Card holder name is required (up to 100 characters)';end if;
 if (make_date(NEW."expiryYear",NEW."expiryMonth",1)+interval '1 month')::date-1<(now() at time zone 'Asia/Kuala_Lumpur')::date then raise exception 'Card expiry cannot be in the past';end if;return NEW;end $function$
;

-- public.normalize_schedule_room()
CREATE OR REPLACE FUNCTION public.normalize_schedule_room()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$begin if NEW.room is null or NEW.room not between 1 and 10 then raise exception 'Select a room from 1 to 10';end if;return NEW;end $function$
;

-- public.write_compatible_schedule()
CREATE OR REPLACE FUNCTION public.write_compatible_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if TG_OP='DELETE' then delete from public."ClassSchedule" where "scheduleID"=OLD.id;return OLD;end if;
 if NEW.room is null or trim(NEW.room)!~*'^(room[[:space:]]*)?(0?[1-9]|10)$' then raise exception 'Select a room from 1 to 10';end if;
 if TG_OP='INSERT' then NEW.id:=coalesce(NEW.id,gen_random_uuid());insert into public."ClassSchedule"("scheduleID","classNameSnapshot","startsAt","endsAt","trainerNameSnapshot",room,fee,"maxCapacity","classStatus","trainerID","classID","currentBooked") values(NEW.id,NEW.name,NEW.starts_at,NEW.ends_at,NEW.trainer,regexp_replace(NEW.room,'[^0-9]','','g')::integer,NEW.fee,NEW.capacity,coalesce(NEW.status,'Active'),NEW.trainer_id,NEW.class_id,coalesce(NEW.current_booked,0));
 else update public."ClassSchedule" set "classNameSnapshot"=NEW.name,"startsAt"=NEW.starts_at,"endsAt"=NEW.ends_at,"trainerNameSnapshot"=NEW.trainer,room=regexp_replace(NEW.room,'[^0-9]','','g')::integer,fee=NEW.fee,"maxCapacity"=NEW.capacity,"classStatus"=NEW.status,"trainerID"=NEW.trainer_id,"classID"=NEW.class_id,"currentBooked"=NEW.current_booked where "scheduleID"=OLD.id;end if;return NEW;end $function$
;

-- public.snapshot_fitness_target()
CREATE OR REPLACE FUNCTION public.snapshot_fitness_target()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if TG_OP='INSERT' then
  select "weeklyTargetMinutes" into NEW."targetDuration" from public."User" where "userID"=NEW."userID";
  if NEW.weight is null or NEW.height is null or NEW."targetDuration" is null then raise exception 'Set current weight, height and weekly target before adding a fitness log';end if;
 else NEW."targetDuration":=OLD."targetDuration";end if;return NEW;
end $function$
;

-- public.settle_online_payment(uuid,text,text,numeric,text,boolean)
CREATE OR REPLACE FUNCTION public.settle_online_payment(payment_id uuid, event_key text, session_id text, paid_amount numeric, paid_currency text, paid boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p payments;b class_bookings;c class_schedules;eligible boolean:=true;sid uuid;
begin
 select * into p from payments where id=payment_id;
 if p.id is null or p.method not in ('Card','E-wallet') or p.provider_session_id is distinct from session_id then raise exception 'Payment session mismatch';end if;
 if p.booking_id is not null then
  select schedule_id into sid from class_bookings where id=p.booking_id;
  select * into c from class_schedules where id=sid for update;
  select * into b from class_bookings where id=p.booking_id for update;
  eligible:=coalesce(b.status='Pending' and c.status='Active' and c.starts_at>now(),false);
 end if;
 if p.subscription_id is not null then
  perform 1 from user_subscriptions where id=p.subscription_id for update;
  eligible:=exists(select 1 from user_subscriptions where id=p.subscription_id and status in ('Pending','Rejected'));
 end if;
 select * into p from payments where id=payment_id for update;
 if exists(select 1 from payment_events where event_id=event_key) then return;end if;
 if paid and (paid_amount<>p.amount or paid_currency<>'myr') then raise exception 'Payment amount or currency mismatch';end if;
 if p.status='Verified' then insert into payment_events values(event_key,now()) on conflict do nothing;return;end if;
 insert into payment_events values(event_key,now()) on conflict do nothing;
 if not paid then
  if p.status='Pending' then
   update payments set status='Rejected' where id=p.id;
   update class_bookings set status='Rejected' where id=p.booking_id and status='Pending';
   update user_subscriptions set status='Rejected' where id=p.subscription_id and status='Pending';
  end if;return;
 end if;
 -- A paid cancelled/deleted booking is retained for staff refund review, never reactivated.
 if p.payment_type='Class' and p.booking_id is null then eligible:=false;end if;
 if p.payment_type='Membership' and p.subscription_id is null then eligible:=false;end if;
 update payments set status='Verified',verified_at=now(),needs_review=not eligible where id=p.id;
 if eligible then
  update class_bookings set status='Booked' where id=p.booking_id and status='Pending';
  update user_subscriptions set status=case when end_date<=(now() at time zone 'Asia/Kuala_Lumpur')::date then 'Expired' else 'Active' end where id=p.subscription_id and status in ('Pending','Rejected');
 end if;
end $function$
;

-- public.gym_action_v16(text,jsonb)
CREATE OR REPLACE FUNCTION public.gym_action_v16(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare uid uuid:=auth.uid(); w numeric;h numeric;
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and account_status='Active') then raise exception 'Active sign-in required';end if;
 if action='save_class_type' then
  if not public.is_staff() then raise exception 'Staff access required';end if;
  payload:=jsonb_set(payload,'{description}',to_jsonb(coalesce(payload->>'description','')));
 end if;
 if action in ('update_profile','set_measurements') and public.profile_role()='member' then
  w:=nullif(payload->>'weight','')::numeric;h:=nullif(payload->>'height','')::numeric;
  if w is not null and not(w>30 and w<300) then raise exception 'Weight must be greater than 30 and less than 300 kg';end if;
  if h is not null and not(h>1.30 and h<2.50) then raise exception 'Height must be greater than 1.30 and less than 2.50 meters';end if;
 end if;
 return public.gym_action_v11(action,payload);
end $function$
;

-- public.gym_action(text,jsonb)
CREATE OR REPLACE FUNCTION public.gym_action(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare result jsonb; path text;
begin
 if action<>'save_class_type' then return public.gym_action_v16(action,payload);end if;
 if auth.uid() is null or not public.is_staff() then raise exception 'Staff access required';end if;
 if payload ? 'image_path' then
  path:=nullif(payload->>'image_path','');
  if path is not null then
   if path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' then raise exception 'Choose a valid uploaded class picture';end if;
   if not exists(select 1 from storage.objects where bucket_id='class-type-images' and name=path) then raise exception 'Picture upload is unavailable. Upload it again.';end if;
  end if;
 end if;
 result:=public.gym_action_v16(action,payload);
 if payload ? 'image_path' then
  update public."ClassType" set "imagePath"=path where "classID"=(result->>'id')::uuid;
 end if;
 return result;
end $function$
;

-- public.sync_staff_auth_profile()
CREATE OR REPLACE FUNCTION public.sync_staff_auth_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

-- public.staff_profile_sync_ready()
CREATE OR REPLACE FUNCTION public.staff_profile_sync_ready()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select exists(select 1 from pg_catalog.pg_trigger t where t.tgrelid='auth.users'::regclass and t.tgname='on_staff_auth_profile_update' and t.tgenabled='O' and t.tgfoid='public.sync_staff_auth_profile()'::regprocedure);
$function$
;

-- public.register_profile()
CREATE OR REPLACE FUNCTION public.register_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

-- public.ensure_separate_account_identity()
CREATE OR REPLACE FUNCTION public.ensure_separate_account_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

-- public.write_separate_profile()
CREATE OR REPLACE FUNCTION public.write_separate_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

-- public.sync_trainer_name_snapshot()
CREATE OR REPLACE FUNCTION public.sync_trainer_name_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if NEW."trainerName" is distinct from OLD."trainerName" then
  update public."ClassSchedule" set "trainerNameSnapshot"=NEW."trainerName" where "trainerID"=NEW."trainerID";
 end if;return NEW;
end;
$function$
;

-- pulse_private.pulse_private.record_booking_attendance(uuid,text)
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

set check_function_bodies=true;
