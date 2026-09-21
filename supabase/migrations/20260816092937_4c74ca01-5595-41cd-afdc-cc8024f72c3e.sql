insert into public.associations (id, name, slug, tagline)
values ('c1000000-0000-4000-8000-000000000005','Vietnam Startup Founders','vietnam-startup-founders','Mạng lưới nhà sáng lập công nghệ Việt Nam')
on conflict (id) do nothing;

insert into public.memberships (user_id, association_id, role)
select 'e3de1319-d8fa-4b8f-ae09-59f4733e6168','c1000000-0000-4000-8000-000000000005','admin'::app_role
where not exists (select 1 from public.memberships where user_id='e3de1319-d8fa-4b8f-ae09-59f4733e6168' and association_id='c1000000-0000-4000-8000-000000000005');

insert into public.members (id, code, name, email, phone, type, level, industry, region, status, joined_at, fee_year, association_id, user_id, about) values
  ('dm-vsf-admin','VSF-ADMIN','ViOne Business Connect','admin@connect.vn','0900000000','company','memberLevel.gold','ind.it','region.south','active','2026-05-04',2026,'c1000000-0000-4000-8000-000000000005','e3de1319-d8fa-4b8f-ae09-59f4733e6168','Ban điều hành cộng đồng'),
  ('dm-vsf-1','VSF-001','Phạm Quốc Bảo','bao.pham@demo.vn','0901000001','company','memberLevel.medium','ind.it','region.south','active','2026-05-12',2026,'c1000000-0000-4000-8000-000000000005',null,'Founder SaaS logistics'),
  ('dm-vsf-2','VSF-002','Ngô Thanh Vân','van.ngo@demo.vn','0901000002','company','memberLevel.medium','ind.retail','region.north','active','2026-05-19',2026,'c1000000-0000-4000-8000-000000000005',null,'Founder thương mại điện tử'),
  ('dm-vsf-3','VSF-003','Đặng Hữu Phước','phuoc.dang@demo.vn','0901000003','company','memberLevel.medium','ind.finance','region.south','active','2026-06-02',2026,'c1000000-0000-4000-8000-000000000005',null,'Founder fintech'),
  ('dm-vsf-4','VSF-004','Bùi Khánh Linh','linh.bui@demo.vn','0901000004','individual','memberLevel.basic','ind.education','region.central','active','2026-06-14',2026,'c1000000-0000-4000-8000-000000000005',null,'Cố vấn tăng trưởng'),
  ('dm-vsf-5','VSF-005','Hoàng Nhật Minh','minh.hoang@demo.vn','0901000005','company','memberLevel.gold','ind.manufacturing','region.north','active','2026-06-28',2026,'c1000000-0000-4000-8000-000000000005',null,'Founder sản xuất thông minh'),
  ('dm-vsf-6','VSF-006','Trịnh Mai Anh','anh.trinh@demo.vn','0901000006','individual','memberLevel.basic','ind.it','region.south','active','2026-07-09',2026,'c1000000-0000-4000-8000-000000000005',null,'Đồng sáng lập AI studio')
on conflict (id) do nothing;

insert into public.events (id, name, date, location, capacity, registered, status, type, association_id) values
  ('dm-ev-vsf-1','Startup Founders Night #12', current_date + 5,'Dreamplex Nguyễn Huệ, TP.HCM',120,64,'upcoming','networking','c1000000-0000-4000-8000-000000000005'),
  ('dm-ev-vsf-2','Demo Day mùa Thu 2026', current_date + 19,'Trung tâm Hội nghị GEM, TP.HCM',400,238,'upcoming','forum','c1000000-0000-4000-8000-000000000005'),
  ('dm-ev-vsf-3','Workshop Gọi vốn vòng Seed', current_date + 33,'Toong Hoàng Đạo Thúy, Hà Nội',80,51,'upcoming','workshop','c1000000-0000-4000-8000-000000000005'),
  ('dm-ev-ceo-3','CEO Golf Networking Day', current_date + 12,'Sân golf Long Thành, Đồng Nai',90,72,'upcoming','networking','c1000000-0000-4000-8000-000000000001'),
  ('dm-ev-ai-3','AI Builders Meetup tháng 9', current_date + 8,'Sihub, TP.HCM',150,96,'upcoming','networking','c1000000-0000-4000-8000-000000000002'),
  ('dm-ev-green-2','Hội thảo ESG cho doanh nghiệp vừa', current_date + 26,'Khách sạn Rex, TP.HCM',180,88,'upcoming','workshop','c1000000-0000-4000-8000-000000000004'),
  ('dm-ev-vione-5','ViOne Executive Roundtable Q4', current_date + 15,'Lotte Center, Hà Nội',60,41,'upcoming','Toạ đàm','6b4c9901-ddf1-439c-826f-4c7f9fc836e9')
on conflict (id) do nothing;

insert into public.event_registrations (id, event_id, member_code, member_name, association_id, status)
select v.id, v.event_id, v.member_code, v.member_name, v.association_id::uuid, 'registered'
from (values
  ('dm-reg-vsf-1','dm-ev-vsf-1','VSF-ADMIN','ViOne Business Connect','c1000000-0000-4000-8000-000000000005'),
  ('dm-reg-vsf-2','dm-ev-vsf-2','VSF-ADMIN','ViOne Business Connect','c1000000-0000-4000-8000-000000000005'),
  ('dm-reg-vione-5','dm-ev-vione-5','VIONE-ADMIN','ViOne Business Connect','6b4c9901-ddf1-439c-826f-4c7f9fc836e9')
) as v(id, event_id, member_code, member_name, association_id)
where not exists (select 1 from public.event_registrations r where r.id = v.id);

insert into public.opportunities (id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline, status, emoji, association_id) values
  ('dm-opp-vsf-1','dm-vsf-1','Tìm đối tác triển khai SaaS logistics','Cần đối tác triển khai và chăm sóc khách hàng doanh nghiệp khu vực phía Bắc cho nền tảng quản lý vận tải.','partnership',300000000,800000000,'region.north','ind.it', now() + interval '24 days','open','🤝','c1000000-0000-4000-8000-000000000005'),
  ('dm-opp-vsf-2','dm-vsf-3','Gọi vốn vòng Seed cho fintech thanh toán B2B','Mở vòng Seed 1,5 triệu USD, ưu tiên nhà đầu tư có mạng lưới ngân hàng và ví điện tử.','investment',null,null,'region.south','ind.finance', now() + interval '40 days','open','💰','c1000000-0000-4000-8000-000000000005'),
  ('dm-opp-vsf-3','dm-vsf-5','Cần nhà cung cấp linh kiện tự động hoá','Tìm nhà cung cấp cảm biến và bộ điều khiển cho dây chuyền lắp ráp, sản lượng 2.000 bộ/quý.','supply',1200000000,2500000000,'region.north','ind.manufacturing', now() + interval '18 days','open','🏭','c1000000-0000-4000-8000-000000000005'),
  ('dm-opp-ceo-3','dm-ceo-2','Hợp tác phân phối hàng tiêu dùng miền Trung','Mở rộng kênh phân phối 3 tỉnh miền Trung, ưu tiên đối tác có sẵn hệ thống kho.','distribution',500000000,1500000000,'region.central','ind.retail', now() + interval '30 days','open','📦','c1000000-0000-4000-8000-000000000001'),
  ('dm-opp-ai-2','dm-ai-1','Tìm nhóm triển khai trợ lý AI nội bộ','Cần đội ngũ triển khai trợ lý AI cho quy trình chăm sóc khách hàng, tích hợp CRM hiện hữu.','demand',200000000,600000000,'region.south','ind.it', now() + interval '21 days','open','🤖','c1000000-0000-4000-8000-000000000002')
on conflict (id) do nothing;

insert into public.business_relationship_moments (id, owner_user_id, target_kind, target_card_id, occurred_at, event_name, place_label, note, status, client_token) values
  ('22222222-2222-4222-8222-000000000001','e3de1319-d8fa-4b8f-ae09-59f4733e6168','saved_card','9f43d6b7-ddda-49f5-b6a8-9759d35171f5', now() - interval '4 days','AI Day Vietnam 2026','GEM Center, TP.HCM','Trao đổi về kế hoạch triển khai trợ lý AI nội bộ, hẹn gửi đề xuất trong tuần tới.','active','22222222-2222-4222-8222-00000000aaa1'),
  ('22222222-2222-4222-8222-000000000002','e3de1319-d8fa-4b8f-ae09-59f4733e6168','saved_card','4bb904c5-fa2a-48e8-a1ca-9a256c98b34c', now() - interval '9 days','Cà phê chiến lược','The Workshop Coffee, Q.1','Bàn về mở rộng kênh phân phối miền Trung, cần chuẩn bị số liệu kho bãi.','active','22222222-2222-4222-8222-00000000aaa2'),
  ('22222222-2222-4222-8222-000000000003','e3de1319-d8fa-4b8f-ae09-59f4733e6168','saved_card','d7e35a53-3dac-485f-a717-6a4a085d8fcc', now() - interval '20 days','Gala Thường niên Hiệp hội','Lotte Center, Hà Nội','Gặp lại ban điều hành và nhóm sáng lập, thống nhất tổ chức Demo Day mùa Thu.','active','22222222-2222-4222-8222-00000000aaa3')
on conflict (id) do nothing;

insert into public.business_relationship_moment_media (id, moment_id, owner_user_id, storage_path, media_type, sort_order, width, height) values
  ('bbbbbbb1-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000001','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/22222222-2222-4222-8222-000000000001/bbbbbbb1-0000-4000-8000-000000000001.jpg','image/jpeg',0,768,960),
  ('bbbbbbb1-0000-4000-8000-000000000002','22222222-2222-4222-8222-000000000001','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/22222222-2222-4222-8222-000000000001/bbbbbbb1-0000-4000-8000-000000000002.jpg','image/jpeg',1,768,960),
  ('bbbbbbb1-0000-4000-8000-000000000003','22222222-2222-4222-8222-000000000002','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/22222222-2222-4222-8222-000000000002/bbbbbbb1-0000-4000-8000-000000000003.jpg','image/jpeg',0,768,960),
  ('bbbbbbb1-0000-4000-8000-000000000004','22222222-2222-4222-8222-000000000003','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/22222222-2222-4222-8222-000000000003/bbbbbbb1-0000-4000-8000-000000000004.jpg','image/jpeg',0,768,960),
  ('bbbbbbb1-0000-4000-8000-000000000005','22222222-2222-4222-8222-000000000003','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/22222222-2222-4222-8222-000000000003/bbbbbbb1-0000-4000-8000-000000000005.jpg','image/jpeg',1,768,960),
  ('bbbbbbb1-0000-4000-8000-000000000006','22222222-2222-4222-8222-000000000003','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/22222222-2222-4222-8222-000000000003/bbbbbbb1-0000-4000-8000-000000000006.jpg','image/jpeg',2,768,960)
on conflict (id) do nothing;