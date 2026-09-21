-- Demo aging: make demo relationships old enough (>45 days) to surface reconnect suggestions
with demo as (select id from auth.users where email in ('admin@connect.vn','jamesnguyen@uranustech.vn'))
update public.user_connections c
set responded_at = now() - interval '68 days',
    updated_at = now() - interval '68 days'
where c.status = 'accepted'
  and (c.requester_user_id in (select id from demo) or c.recipient_user_id in (select id from demo));