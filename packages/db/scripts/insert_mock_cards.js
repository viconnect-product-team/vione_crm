const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const adminId = '00000000-0000-0000-0000-000000000000';
const peer1Id = '93de8236-fafd-45c4-97b9-2a0e2dc3db83';
const peer2Id = 'e3de1319-d8fa-4b8f-ae09-59f4733e6168';
const peer3Id = '4f15cc7d-6e30-4192-ac9c-290ace8ea71d';
const peer4Id = '200d9302-c5b6-4f2c-8eca-9c51cf6284fc';

const cards = [
  { id: '11111111-1111-1111-1111-111111111111', slug: 'admin', owner_user_id: adminId, display_name: 'Administrator', professional_title: 'Hệ Thống Admin', company_name: 'VIONE Group', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  { id: '22222222-2222-2222-2222-222222222222', slug: 'james-nguyen', owner_user_id: peer1Id, display_name: 'James Nguyen', professional_title: 'Giám đốc Công nghệ', company_name: 'UranusTech', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: '33333333-3333-3333-3333-333333333333', slug: 'demo-user', owner_user_id: peer2Id, display_name: 'Demo User', professional_title: 'Trưởng phòng Nhân sự', company_name: 'VIONE Hub', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: '44444444-4444-4444-4444-444444444444', slug: 'nguyen-hoang-nam', owner_user_id: peer3Id, display_name: 'Nguyen Hoang Nam', professional_title: 'Sáng lập viên', company_name: 'Nam Group', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { id: '55555555-5555-5555-5555-555555555555', slug: 'tran-thu-thao', owner_user_id: peer4Id, display_name: 'Tran Thu Thao', professional_title: 'Giám đốc Marketing', company_name: 'Thao Creative', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log('Connected to DB.');

  for (const c of cards) {
    await client.query(`
      INSERT INTO public.member_business_cards (id, slug, card_kind, status, public_mode, display_name, professional_title, company_name, avatar_url, owner_user_id, created_at, updated_at)
      VALUES ($1::uuid, $2, 'primary', 'published', 'public', $3, $4, $5, $6, $7::uuid, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        display_name = EXCLUDED.display_name,
        professional_title = EXCLUDED.professional_title,
        company_name = EXCLUDED.company_name,
        avatar_url = EXCLUDED.avatar_url,
        owner_user_id = EXCLUDED.owner_user_id,
        updated_at = now()
    `, [c.id, c.slug, c.display_name, c.professional_title, c.company_name, c.avatar_url, c.owner_user_id]);
    console.log(`Upserted card for ${c.display_name}`);
  }

  await client.end();
}

main().catch(console.error);
