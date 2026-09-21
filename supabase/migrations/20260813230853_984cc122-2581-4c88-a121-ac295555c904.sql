-- Demo data only: age a few viewer-owned edges past the 45-day reconnect threshold.
with demo_users as (
  select id from auth.users where email in ('admin@connect.vn','jamesnguyen@uranustech.vn')
), aged as (
  select s.ctid, row_number() over (partition by s.owner_user_id order by s.saved_at asc) rn
  from saved_business_cards s
  join demo_users d on d.id = s.owner_user_id
  where s.archived = false
)
update saved_business_cards s
set saved_at = now() - ((45 + a.rn * 18) || ' days')::interval
from aged a
where s.ctid = a.ctid and a.rn <= 3;

with demo_users as (
  select id from auth.users where email in ('admin@connect.vn','jamesnguyen@uranustech.vn')
), aged as (
  select g.ctid, row_number() over (partition by g.owner_user_id order by g.first_shared_at asc) rn
  from guest_contacts g
  join demo_users d on d.id = g.owner_user_id
)
update guest_contacts g
set first_shared_at = now() - ((52 + a.rn * 14) || ' days')::interval
from aged a
where g.ctid = a.ctid and a.rn <= 2;