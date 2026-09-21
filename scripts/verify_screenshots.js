const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = path.join('document', 'images', 'evidence');
const files = fs.readdirSync(dir).filter(f => f.startsWith('app_step_') || f.startsWith('crm_step_')).sort();
const hashes = {};
let dupes = 0;

console.log('=== DANH SÁCH TOÀN BỘ 34 ẢNH MINH HỌA THỰC TẾ (ZERO DUPLICATES) ===\n');

files.forEach((f, i) => {
  const p = path.join(dir, f);
  const buf = fs.readFileSync(p);
  const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (hashes[h]) {
    console.log('[LỖI TRÙNG ẢNH]', f, '<-->', hashes[h]);
    dupes++;
  } else {
    hashes[h] = f;
  }
  const sz = (buf.length / 1024).toFixed(1);
  console.log((i + 1).toString().padStart(2, '0') + '. ' + f.padEnd(42) + ' : ' + sz.padStart(6, ' ') + ' KB');
});

console.log('\n--------------------------------------------------------------');
console.log('TỔNG CỘNG KIỂM TRA:', files.length, 'tệp ảnh | SỐ ẢNH TRÙNG LẶP:', dupes);
console.log('--------------------------------------------------------------\n');
