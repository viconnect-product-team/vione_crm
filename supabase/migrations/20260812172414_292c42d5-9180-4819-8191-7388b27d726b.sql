
insert into public.business_relationship_moments
 (id, owner_user_id, target_kind, target_card_id, occurred_at, event_name, place_label, note, status, client_token)
values
 ('11111111-1111-4111-8111-000000000001','e3de1319-d8fa-4b8f-ae09-59f4733e6168','saved_card','a2cdcc9a-f327-4ce4-b84f-a38dc71dd478', now() - interval '2 days','Hội nghị ViOne 2026','GEM Center, TP.HCM','Gặp tại phiên thảo luận về chuyển đổi số. Trao đổi về khả năng hợp tác triển khai nền tảng cho chuỗi bán lẻ trong quý tới.','active', gen_random_uuid()),
 ('11111111-1111-4111-8111-000000000002','e3de1319-d8fa-4b8f-ae09-59f4733e6168','saved_card','9f43d6b7-ddda-49f5-b6a8-9759d35171f5', now() - interval '9 days','Cà phê doanh nhân','The Coffee House, Quận 1','Trao đổi nhanh về nhu cầu mở rộng hệ thống kho. Hẹn gửi đề xuất chi tiết trong tuần sau.','active', gen_random_uuid()),
 ('11111111-1111-4111-8111-000000000003','e3de1319-d8fa-4b8f-ae09-59f4733e6168','saved_card','4bb904c5-fa2a-48e8-a1ca-9a256c98b34c', now() - interval '21 days','Tiệc kết nối cuối tháng','Reverie Saigon','Buổi giao lưu ấm cúng, giới thiệu thêm hai đối tác ngành logistics. Cần theo dõi cơ hội vận chuyển xuyên biên giới.','active', gen_random_uuid()),
 ('22222222-2222-4222-8222-000000000001','93de8236-fafd-45c4-97b9-2a0e2dc3db83','saved_card','a2cdcc9a-f327-4ce4-b84f-a38dc71dd478', now() - interval '3 days','Hội nghị ViOne 2026','GEM Center, TP.HCM','Kết nối trực tiếp sau phiên tọa đàm. Cùng quan tâm mảng dữ liệu khách hàng.','active', gen_random_uuid()),
 ('22222222-2222-4222-8222-000000000002','93de8236-fafd-45c4-97b9-2a0e2dc3db83','saved_card','d7e35a53-3dac-485f-a717-6a4a085d8fcc', now() - interval '12 days','Gặp tại văn phòng','Bitexco, Quận 1','Thảo luận vòng gọi vốn và tiêu chí đầu tư. Hẹn gặp lại tháng sau.','active', gen_random_uuid())
on conflict (id) do nothing;

insert into public.business_relationship_moment_media
 (id, moment_id, owner_user_id, storage_path, media_type, sort_order, width, height)
values
 ('aaaaaaa1-0000-4000-8000-000000000001','11111111-1111-4111-8111-000000000001','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/11111111-1111-4111-8111-000000000001/aaaaaaa1-0000-4000-8000-000000000001.jpg','image/jpeg',0,1024,640),
 ('aaaaaaa1-0000-4000-8000-000000000002','11111111-1111-4111-8111-000000000002','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/11111111-1111-4111-8111-000000000002/aaaaaaa1-0000-4000-8000-000000000002.jpg','image/jpeg',0,900,900),
 ('aaaaaaa1-0000-4000-8000-000000000003','11111111-1111-4111-8111-000000000002','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/11111111-1111-4111-8111-000000000002/aaaaaaa1-0000-4000-8000-000000000003.jpg','image/jpeg',1,900,900),
 ('aaaaaaa1-0000-4000-8000-000000000004','11111111-1111-4111-8111-000000000002','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/11111111-1111-4111-8111-000000000002/aaaaaaa1-0000-4000-8000-000000000004.jpg','image/jpeg',2,900,900),
 ('aaaaaaa1-0000-4000-8000-000000000005','11111111-1111-4111-8111-000000000003','e3de1319-d8fa-4b8f-ae09-59f4733e6168','e3de1319-d8fa-4b8f-ae09-59f4733e6168/11111111-1111-4111-8111-000000000003/aaaaaaa1-0000-4000-8000-000000000005.jpg','image/jpeg',0,900,900),
 ('bbbbbbb1-0000-4000-8000-000000000001','22222222-2222-4222-8222-000000000001','93de8236-fafd-45c4-97b9-2a0e2dc3db83','93de8236-fafd-45c4-97b9-2a0e2dc3db83/22222222-2222-4222-8222-000000000001/bbbbbbb1-0000-4000-8000-000000000001.jpg','image/jpeg',0,1024,640),
 ('bbbbbbb1-0000-4000-8000-000000000002','22222222-2222-4222-8222-000000000002','93de8236-fafd-45c4-97b9-2a0e2dc3db83','93de8236-fafd-45c4-97b9-2a0e2dc3db83/22222222-2222-4222-8222-000000000002/bbbbbbb1-0000-4000-8000-000000000002.jpg','image/jpeg',0,900,900)
on conflict (id) do nothing;
