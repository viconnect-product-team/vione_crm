# 18 — HDSD / Training HTML + PDF (playbook PM)

> **SoT OS:** `_vibe-team-os/18-HDSD-TRAINING-HTML-PDF.md`  
> **Reference project:** UnitelWater (`docs/training/`, `scripts/build-training-docs.mjs`)  
> **Updated:** 2026-07-25  
> **Owner roles:** PM điều phối · `ba-docs` / BA soạn · QC spot-check trước gửi khách

## Khi nào dùng

Sponsor / đối tác cần **Hướng dẫn sử dụng (HDSD)** hoặc **tài liệu đào tạo** HTML để in PDF / trình bày — không phải BRD/SRS gửi khách (BRD/SRS vẫn theo `13` + skill `client-delivery-brd-srs`).

| Deliverable | File kiểu |
|-------------|-----------|
| HDSD HTML (in PDF) | `docs/training/*_UNITELWATER.html` hoặc `docs/training/TRAINING_*.html` |
| Slide đào tạo | `docs/training/TRAINING_*.pptx` + `TRAINING_*_lo.pptx` (builder `build-training-pptx.mjs`) |
| Screenshot thật | `docs/training/screenshots/*.png` |

## Nguyên tắc bắt buộc (PM quán triệt)

1. **Song ngữ 100%** — mọi dòng chữ người đọc được = VI + Lao (hoặc ngôn ngữ phụ của dự án). Không chỗ VI-only. Brand / mã tài liệu / URL được giữ nguyên.
2. **Ngôn ngữ nghiệp vụ** — cấm route, `menu_*`, key API, jargon kỹ thuật trên HTML khách/đào tạo.
3. **Quy trình theo vai trò trước** — ai làm gì → bước tiếp theo ở đâu (ví dụ: QR → gán đồng hồ → đọc → xác nhận ở đâu) trước khi đi sâu từng module.
4. **Screenshot thật** trên đúng công ty/tenant demo vận hành (không tenant rác).
5. **In PDF:** bìa đúng 1 tờ A4; phần sau = dải HTML dài; trình duyệt tự cắt trang; ảnh full, không khung/padding cắt ảnh.

## Layout HTML (chuẩn UnitelWater — tái dùng)

```
<article class="trn-doc">
  <section class="cover">     <!-- đúng 210×297mm, page-break-after -->
  <div class="trn-flow">      <!-- dải dài -->
    <section class="trn-section" id="...">  <!-- mỗi chương bắt đầu trang mới khi in -->
    ...
  </div>
</article>
```

### CSS in (tóm tắt)

| Rule | Mục đích |
|------|----------|
| `@page { size: A4; margin: 18mm 14mm 20mm 14mm }` | Lề trên/dưới — nội dung không sát mép |
| `@page :first { margin: 0 }` | Bìa full bleed A4 |
| `.cover { height:297mm; page-break-after: always }` | Trang 1 đúng A4 |
| `.trn-section { page-break-before: always }` (trừ section đầu trong flow) | Hết chương → chương sau sang trang mới |
| `.trn-shot img { width:100%; height:auto; max-height:none }` | Ảnh đủ, không crop |
| `.trn-shot` không border / padding / shadow | Screenshot “sát” như chụp |
| **Không** `overflow:hidden` + `flex:1` trên trang nội dung dài | Tránh trang trắng / cắt chữ khi print |

### Chrome Save as PDF

- **Margins = Default** (không chọn None — None xóa `@page` margin)
- **Background graphics = On**
- Paper: A4 · Portrait

### Không làm lại lỗi đã gặp

| Triệu chứng | Nguyên nhân | Cách đúng |
|-------------|-------------|-----------|
| Trang trắng sau bìa | `flex:1` + `min-height:297mm` đẩy footer sang trang sau | Bìa khóa 297mm + `overflow:hidden` trong cover; body flow dài |
| Ảnh bị cắt nửa | `max-height` + `object-fit` + card A4 `overflow:hidden` | Ảnh full width, không max-height crop |
| Chữ sát mép PDF | Margins: None hoặc `@page` thiếu | `@page` margin + Margins Default |
| Header `UNITELWATER · … · TRN-001` lặp mỗi trang | `sec-head` trên mỗi section | Bỏ header bar trên dải dài; chỉ cover / TOC title trong body |

## Pipeline dự án (mẫu)

```bash
# Nội dung song ngữ SoT
scripts/lib/training-content.mjs   # mọi string = { vi, lo }

# Build HTML
node scripts/build-training-docs.mjs
# → docs/training/TRAINING_*.html

# Screenshot (env)
UW_EMAIL=... UW_PASSWORD=... UW_COMPANY=... node scripts/capture-training-screenshots.mjs

# PPTX (tuỳ)
node scripts/build-training-pptx.mjs
```

## Dispatch PM (gợi ý)

| Wave | Role | Exit |
|------|------|------|
| Soạn khung + song ngữ | `ba-docs` / BA | Content `{vi,lo}` đủ; không VI-only |
| Capture UI | `qa` hoặc Dev hỗ trợ script | PNG đúng tenant |
| Build HTML + print spot-check | `ba-docs` | Preview PDF: bìa A4, lề ổn, ảnh đủ |
| Gate gửi | `qc` | Checklist dưới PASS |

## Checklist QC trước gửi

- [ ] Cover = 1 trang A4 khi print  
- [ ] Từ mục lục trở đi: dải dài; mỗi chương lớn bắt đầu trang mới  
- [ ] Không header bar lặp TRN trên mọi trang nội dung  
- [ ] Mọi dòng chữ song ngữ  
- [ ] Screenshot không viền/padding; hiện đủ nội dung ảnh  
- [ ] Margins Default + Background On → không sát mép, màu hộp còn  
- [ ] Không route / key kỹ thuật trong body  

## Hai bản HTML theo ngôn ngữ chủ

| File | Chủ | Phụ (nhỏ hơn, `.lo`) |
|------|-----|----------------------|
| `TRAINING_*.html` | VI | Lao |
| `TRAINING_*_lo.html` | Lao | VI |

Cùng builder `buildHtml('vi'|'lo')`, cùng screenshot/layout/print. Không ghi meta yêu cầu vào nội dung tài liệu khách.

## Liên hệ file UnitelWater

- Builder: `scripts/build-training-docs.mjs`  
- Content: `scripts/lib/training-content.mjs`  
- Output: `docs/training/TRAINING_UNITELWATER.html` (VI chủ) + `TRAINING_UNITELWATER_lo.html` (Lào chủ)  
- Context: `docs/program/HANDOFF_TRAINING_DOCS_CONTEXT.md`  

## Reuse-tag

`hdsd-html-pdf`, `training-bilingual`, `training-lo-primary`, `print-a4-cover-flow`, `screenshot-full-bleed`, `unitelwater-training`
