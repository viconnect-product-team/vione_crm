create policy "users read own identity avatar"
on storage.objects for select to authenticated
using (bucket_id = 'identity-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users upload own identity avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'identity-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own identity avatar"
on storage.objects for update to authenticated
using (bucket_id = 'identity-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'identity-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own identity avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'identity-avatars' and (storage.foldername(name))[1] = auth.uid()::text);