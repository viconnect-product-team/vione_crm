const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/accounts_dump.json', 'utf8'));

console.log('Tổng số users:', data.users.length);
data.users.forEach((u, i) => {
  console.log((i+1) + '. ' + u.name + ' | Email: ' + u.email + ' | Mã HV: ' + (u.member_code || 'N/A') + ' | SĐT: ' + (u.phone || 'N/A') + ' | Status: ' + (u.member_status || 'N/A') + ' | Vai trò: ' + (u.executive_role || 'N/A'));
});
