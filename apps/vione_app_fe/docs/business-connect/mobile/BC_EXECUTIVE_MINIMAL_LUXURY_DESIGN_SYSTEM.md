# Business Connect — Executive Minimal Luxury

Nguồn chân lý (source of truth) về UI cho toàn bộ `/connect-app/**`.
Phạm vi CSS: `.bc-app` (và `.bc-app-viewport` cho layout trang). Không đụng `--vba-*`, `/m/**`, admin, hoặc sản phẩm khác.

---

## 1. Triết lý

Executive · Premium · Minimal · Private · Trusted · Modern.

> Deep Navy là không gian chính. Champagne Gold chỉ dẫn sự chú ý. Nội dung quan trọng hơn trang trí.

Cảm giác mục tiêu: **"Private Business Network in your pocket"** — không phải "CRM dashboard on mobile".

Tránh: SaaS dashboard, CRM, mạng xã hội đại trà, fintech nhiều hiệu ứng, AI app, gaming, web admin thu nhỏ.

---

## 2. Palette

Không dùng `#000000`, không dùng trắng tinh cho mọi chữ.

| Vai trò | Token | Giá trị |
| --- | --- | --- |
| Nền sâu nhất | `--bc-bg-deep` | `#080F19` |
| Nền chính | `--bc-bg-primary` | `#0B121D` |
| Nền phụ | `--bc-bg-secondary` | `#0F1624` |
| Bề mặt | `--bc-surface` | `#151D2E` |
| Bề mặt nổi | `--bc-surface-elevated` | `#192235` |
| Gold 300 | `--bc-gold-300` | `#FFDFA8` |
| Gold 400 | `--bc-gold-400` | `#FFC97A` |
| Gold 500 (accent) | `--bc-gold-500` | `#F2B45A` |
| Gold 600 | `--bc-gold-600` | `#D99A3E` |
| Chữ chính | `--bc-text-primary` | `#F5F7FA` |
| Chữ phụ | `--bc-text-secondary` | `#B8C0CD` |
| Metadata | `--bc-text-tertiary` | `#8B93A6` |
| Disabled | `--bc-text-disabled` | `#626B7C` |

Gradient nền (gần như không nhận thấy), áp ở `.bc-app-viewport`:

```css
linear-gradient(180deg, #080F19 0%, #0B121D 48%, #0F1624 100%)
```

Gold được dùng cho: nút V, CTA chính, active/selected state, icon quan trọng, verified/member badge, khung QR, NFC, viền mảnh, indicator. Không dùng gold làm nền diện tích lớn (ngoại lệ: CTA đặc biệt như NFC).

---

## 3. Semantic tokens (namespace `--bc-mobile-*`)

Đây là namespace duy nhất; các token nền tảng ở trên được ánh xạ vào đây để giữ tương thích với BC-Mobile-0B.

```
--bc-mobile-bg            → --bc-bg-primary
--bc-mobile-bg-deep       → --bc-bg-deep
--bc-mobile-surface       → --bc-surface
--bc-mobile-surface-2     → --bc-surface-elevated
--bc-mobile-navy          → --bc-bg-secondary
--bc-mobile-navy-deep     → --bc-bg-deep
--bc-mobile-app-gradient  → gradient nền dọc

--bc-mobile-text          → --bc-text-primary
--bc-mobile-text-2        → --bc-text-secondary
--bc-mobile-muted         → --bc-text-tertiary
--bc-mobile-disabled      → --bc-text-disabled

--bc-mobile-border        → --bc-border-medium   rgba(255,255,255,.10)
--bc-mobile-border-subtle → --bc-border-subtle   rgba(255,255,255,.07)
--bc-mobile-border-gold   → --bc-border-gold     rgba(242,180,90,.45)
--bc-mobile-border-strong → #7C879A  (chỉ cho viền input, đạt 1.4.11 ≥ 3:1)

--bc-mobile-accent        → --bc-gold-500
--bc-mobile-accent-strong → --bc-gold-400
--bc-mobile-accent-on     → #101722  (chữ trên nền gold)
--bc-mobile-accent-grad / -hover / -active → CTA gradient champagne
```

Quy tắc: **không hard-code màu trong component**. Luôn dùng token.

---

## 4. Typography

Inter (SF Pro trên iOS nếu phù hợp).

| Cấp | Size | Weight |
| --- | --- | --- |
| Page title | 26–30px | 600 |
| Section title | 18–20px | 600 |
| Person name | 16–18px | 600 |
| Body | 14–16px | 400 |
| Metadata | 12–13px | 400 |
| Caption | 11–12px | 400–500 |

Nhãn gold in hoa (ví dụ `BUSINESS IDENTITY`): `letter-spacing: .20em; font-weight: 500`. Dùng tiết chế.

---

## 5. Spacing & radius

Spacing scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48. Padding ngang mobile mặc định **20px**. Ưu tiên breathing room hơn nhồi thông tin.

| Token | Giá trị |
| --- | --- |
| `--bc-radius-sm` | 10px |
| `--bc-radius-md` | 14px |
| `--bc-radius-lg` | 18px (card mặc định) |
| `--bc-radius-xl` | 24px |
| `--bc-radius-sheet` | 30px (bottom sheet) |

---

## 6. Shadow & blur

```
--bc-mobile-shadow-surface: 0 12px 36px rgba(0,0,0,.20)
--bc-mobile-shadow-gold:    0 8px 30px rgba(242,180,90,.10)
--bc-mobile-shadow-cta:     0 8px 28px rgba(242,180,90,.14)
--bc-mobile-shadow-v:       0 10px 30px rgba(242,180,90,.16)
--bc-mobile-shadow-nav:     0 -10px 30px rgba(0,0,0,.28)
```

Blur chỉ dùng nhẹ cho bottom navigation, bottom sheet, floating control (`rgba(11,18,29,.92)` + `blur(18px)`). Không glassmorphism.

---

## 7. Component primitives

`BcPage` · `BcTopBar` · `BcSection` · `BcSurface` · `BcActionRow` · `BcPrimaryButton` (`.bc-cta-gold`) · `BcSecondaryButton` (`.bc-cta-gold-soft`) · `BcIconButton` · `BcAvatar` · `BcBadge` · `BcTabs` · `BcSearch` · `BcBottomSheet` · `BcBusinessCard` · `BcPersonRow` · `BcEmptyState` · `BcSkeleton` · `BcBottomNav` · `BcVButton`.

Adoption theo hướng incremental — không refactor ồ ạt gây rủi ro.

Quy ước chính:

- **Card**: dark surface, viền hairline, radius 16–20px, shadow tối thiểu. Chỉ dùng card khi có ý nghĩa phân cấp.
- **Person row**: avatar 48px, tên, `Role · Company`, ngữ cảnh quan hệ tuỳ chọn, chevron/menu im lặng. Không score, KPI, %AI, thanh "relationship health".
- **Business Identity card**: hero component; navy, viền champagne mảnh, portrait, tên + verified, chức danh, công ty, badge member, location, website, dấu V lớn mờ. Không giống thẻ ngân hàng.
- **Avatar**: 40px list · 48px network · 72–96px profile. Không nhiều vòng glow.
- **Icon**: Lucide outline, stroke 1.5–1.75, màu mặc định `--bc-mobile-text-2`; gold chỉ cho action quan trọng.
- **Search**: cao 48px, radius 14–16px, nền surface, viền hairline, placeholder `--bc-text-tertiary`. Không input trắng.
- **Tabs**: text tab, active = champagne + gạch gold mảnh, inactive = muted. Không segmented control nặng.
- **Bottom sheet**: nền `#0B1522`/`#0F1926`, top radius 30px, drag handle `rgba(255,255,255,.30)`, padding 20–24px.
- **Bottom nav**: đúng 5 vị trí Home · Network · V · Community · Me. Active gold, inactive muted. Không tab thứ sáu.
- **V button**: tròn ~56–60px, trung tâm, champagne, glow tinh tế; V không điều hướng — mở V Action Sheet với các action LIVE.

---

## 8. Motion

150–220ms, `ease-out`. Cho phép: fade, translate nhẹ, press scale ~0.995, sheet slide. Cấm: bounce, spring mạnh, glow nhấp nháy, gradient động. Luôn tôn trọng `prefers-reduced-motion`.

---

## 9. Accessibility

- Text ≥ 4.5:1; icon/viền chức năng ≥ 3:1.
- Focus ring gold `--bc-mobile-accent`, offset 2px, hiển thị trên mọi control.
- Touch target ≥ 44px (nav ≥ 52px).
- Safe-area top/bottom qua `--bc-mobile-safe-*`.
- Không dùng opacity để làm mờ chữ xuống dưới ngưỡng AA.
- Kiểm tra ở 390px và 430px, không tràn ngang.

---

## 10. DO / DON'T

**DO**: nền navy sâu · điểm nhấn champagne · nhiều negative space · typography hierarchy mạnh · icon tối giản · ít card · divider nhẹ · CTA rõ · ảnh chân dung executive · motion tiết chế.

**DON'T**: nền trắng trong `/connect-app` · xanh SaaS · tím AI · neon · glassmorphism quá mức · nhiều gradient · KPI dashboard trên mobile · quá nhiều card/badge/CTA · border mạnh · shadow mạnh · text dài · mỗi feature một màu riêng.

**Nội dung**: ngắn. "Gợi ý cho bạn" thay vì một câu mô tả AI dài. AI là intelligence layer, không phải visual theme — không sparkle/robot/"AI Powered" khắp nơi.

---

## 11. Quy tắc triển khai

1. Mọi UI mới dưới `/connect-app/**` mặc định dùng design system này.
2. Không tạo màu / gradient / radius / shadow / button style / card style mới nếu chưa có lý do rõ ràng. **Prefer reuse before invention.**
3. Không tạo design system song song: chỉ một namespace `--bc-mobile-*` trong scope `.bc-app`.
4. `/b/*` (thẻ công khai) dùng cùng brand language nhưng tối ưu cho khách/guest.
5. Test cuối: bỏ logo đi, giao diện có còn trông như sản phẩm cho giới doanh nhân cao cấp không? Nếu không — giảm decoration, tăng whitespace, giảm số màu, tăng hierarchy, giảm card, giảm CTA.
