const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&sslmode=disable',
});
client.connect().then(async () => {
  await client.query("UPDATE public.documents SET code = 'DOC-VIONE-01', name = 'Quy Chế Hoạt Động & Chuẩn Mực Quản Trị ViOne Platform 5.0', category = 'Quy chế doanh nghiệp', uploaded_by = 'Ban Lãnh Đạo ViOne' WHERE code LIKE '%CEO1983%' OR name LIKE '%CEO 1983%';");
  console.log('Cleaned documents table successfully!');
  const sample = await client.query("SELECT * FROM public.documents LIMIT 1;");
  console.log('Updated document:', sample.rows);
  await client.end();
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
