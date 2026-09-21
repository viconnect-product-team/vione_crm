# Trang Cộng đồng (Connect-app) — Đánh giá & phương án triển khai

## 1. Hiện trạng

Màn Cộng đồng đang là **danh sách văn bản tối giản** (kiểu editorial của giai đoạn 7A):

- Tiêu đề "Cộng đồng của tôi" + danh sách hàng ngang: logo vuông, tên, số thành viên, mũi tên.
- Vào chi tiết mới thấy Thành viên / Sự kiện sắp tới / Cơ hội kinh doanh.
- Không có: header hai dòng (tiêu đề + phụ đề), ô hành động nổi, dải ngang "sắp tới", tabs + bộ lọc, thẻ nội dung có ảnh lớn, gợi ý của ViOne.

So với thiết kế anh gửi (ngôn ngữ Network mới: nền tối, vàng gold, ảnh thật, thẻ bo góc, hàng hành động), trang Cộng đồng hiện **lệch khoảng 70%** — chủ yếu ở lớp trình bày, còn dữ liệu và nghiệp vụ đã đủ.

## 2. Nguyên tắc

- Chỉ thay lớp giao diện. Không đổi nghiệp vụ, không thêm bảng, không tạo Community Feed / bài đăng / chat (đang trong phạm vi đóng băng của 7B).
- Chỉ hiển thị dữ liệu đã có thật: cộng đồng của tôi, thành viên, sự kiện, cơ hội, trạng thái đăng ký/quan tâm.
- Dùng đúng bộ màu và token của hệ thống (navy nền, vàng gold nhấn, chữ ngà), giống Network.
- Tiếng Việt qua i18n, có bản tiếng Anh; chạm tối thiểu 44px; hỗ trợ màn hình nhỏ.

## 3. Cấu trúc màn hình đề xuất

**A. Header** — "Cộng đồng" (đậm, lớn) + phụ đề "Kết nối – Sự kiện – Cơ hội"; bên phải icon tìm kiếm và chuông, đồng bộ với Network.

**B. Ô hành động** — thẻ bo góc viền vàng nhạt: "Bạn đang quan tâm điều gì?" → mở nhanh danh sách cơ hội đang mở. (Không tạo mới sự kiện/cơ hội.)

**C. Dải ngang "Sắp diễn ra"** — các sự kiện gần nhất của mọi cộng đồng tôi tham gia: ảnh/nền gradient, tên sự kiện, ngày, nhãn "Đã đăng ký" nếu có. Chạm → chi tiết sự kiện.

**D. Tabs + Bộ lọc** — "Tất cả" | "Cộng đồng của tôi" | "Cơ hội"; bên phải nút Bộ lọc (theo cộng đồng, theo trạng thái quan tâm/đăng ký). Gạch chân vàng cho tab đang chọn.

**E. Danh sách thẻ cộng đồng** — thay hàng text bằng thẻ:
- Hàng trên: logo tròn/vuông bo, tên cộng đồng, huy hiệu vai trò (Quản trị/Thành viên).
- Hàng phụ: số thành viên • số sự kiện sắp tới • số cơ hội đang mở.
- Hàng hành động: "Thành viên" | "Sự kiện" | "Cơ hội".
- Dải gợi ý ViOne (tuỳ chọn): ví dụ "3 cơ hội mới trong 7 ngày" + CTA "Xem cơ hội".

**F. Trạng thái rỗng / lỗi** — icon nhẹ, một dòng mô tả, một nút hành động; giữ nguyên nguyên tắc "một trạng thái không khả dụng trung tính".

**G. Chi tiết cộng đồng** — giữ cấu trúc 7B (Thành viên · Sắp tới · Cơ hội, tối đa 2 mục xem trước) nhưng dựng lại theo cùng ngôn ngữ thẻ, thêm ảnh và hàng hành động.

## 4. Cách làm (kỹ thuật, ngắn)

- Tái sử dụng các khối trình bày đã có ở Network (thẻ, dải ngang, hàng hành động) tách thành thành phần dùng chung để hai màn không lệch nhau.
- Số liệu tổng hợp cho thẻ (số sự kiện sắp tới, số cơ hội mở) lấy từ dữ liệu xem trước hiện có của từng cộng đồng; không thêm truy vấn mới nếu chưa cần.
- Bổ sung khóa i18n mới cho tiêu đề, tabs, nhãn hành động, trạng thái rỗng (vi + en).
- Giữ nguyên khóa bộ nhớ đệm theo người xem; không đụng lớp máy chủ.

## 5. Thứ tự triển khai

1. Header + ô hành động + trạng thái rỗng/lỗi mới.
2. Thẻ cộng đồng và hàng hành động.
3. Dải "Sắp diễn ra" và tabs + bộ lọc.
4. Đồng bộ chi tiết cộng đồng theo cùng ngôn ngữ thẻ.
5. Rà i18n, kiểm tra trên iPhone/Android nhỏ, chạy lại bộ kiểm thử liên quan.

## 6. Cần anh xác nhận

- Thiết kế anh gửi là màn Network; em áp dụng **đúng ngôn ngữ thiết kế đó** cho Cộng đồng. Nếu anh có bản vẽ riêng cho Cộng đồng, gửi thêm để em bám 100%.
- Có cần dải "ViOne gợi ý" trong Cộng đồng không, hay để trống ở giai đoạn này.
