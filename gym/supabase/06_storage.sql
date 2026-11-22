-- Public promotional pictures; only active staff may upload, list or delete objects.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('class-type-images','class-type-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy class_picture_insert on storage.objects for insert to authenticated
with check(bucket_id='class-type-images' and public.is_staff() and (storage.foldername(name))[1]=auth.uid()::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');
create policy class_picture_select on storage.objects for select to authenticated
using(bucket_id='class-type-images' and public.is_staff());
create policy class_picture_delete on storage.objects for delete to authenticated
using(bucket_id='class-type-images' and public.is_staff());
