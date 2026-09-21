const fs = require('fs');
const path = require('path');
let pg;
try {
  pg = require('pg');
} catch {
  try {
    pg = require('../../viconnect_project/node_modules/pg');
  } catch {
    pg = require('d:/download/VICONNECT/CEO_VIONE_PROJECT/viconnect_project/node_modules/pg');
  }
}
const { Client } = pg;

const POSTGRES_URL = "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/postgres";
const STANDALONE_DB_NAME = "vione_standalone_app";
const STANDALONE_DB_URL = `postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/${STANDALONE_DB_NAME}`;

async function main() {
  console.log('=== KHỞI TẠO CƠ SỞ DỮ LIỆU RIÊNG CHO VIONE_PROJECT ===');

  // Bước 1: Kết nối postgres và tạo database vione_standalone_app nếu chưa có
  const pgClient = new Client({ connectionString: POSTGRES_URL });
  await pgClient.connect();
  console.log('1. Đã kết nối tới PostgreSQL server.');

  try {
    const checkDb = await pgClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [STANDALONE_DB_NAME]);
    if (checkDb.rows.length === 0) {
      console.log(`Đang tạo database riêng: ${STANDALONE_DB_NAME}...`);
      await pgClient.query(`CREATE DATABASE ${STANDALONE_DB_NAME}`);
      console.log(`Database ${STANDALONE_DB_NAME} đã được tạo thành công!`);
    } else {
      console.log(`Database ${STANDALONE_DB_NAME} đã tồn tại sẵn.`);
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra/tạo database:', err.message);
  } finally {
    await pgClient.end();
  }

  // Bước 2: Kết nối tới vione_standalone_app và chạy migration + seed CRM
  console.log(`\n2. Đang kết nối tới ${STANDALONE_DB_NAME}...`);
  const client = new Client({ connectionString: STANDALONE_DB_URL });
  await client.connect();
  console.log(`Đã kết nối thành công tới ${STANDALONE_DB_NAME}!`);

  try {
    console.log('3. Khởi tạo schema auth, storage, extensions và prerequisite tables...');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text,
        role text
      );

      CREATE TABLE IF NOT EXISTS public.vione_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        name TEXT,
        avatar_url TEXT,
        google_id TEXT UNIQUE,
        apple_id TEXT UNIQUE,
        email_verified BOOLEAN DEFAULT false,
        apple_refresh_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      INSERT INTO auth.users (id, email, role) VALUES
        ('93de8236-fafd-45c4-97b9-2a0e2dc3db83', 'jamesnguyen@uranustech.vn', 'authenticated'),
        ('e3de1319-d8fa-4b8f-ae09-59f4733e6168', 'demo.user@vione.vn', 'authenticated'),
        ('4f15cc7d-6e30-4192-ac9c-290ace8ea71d', 'peer1@vione.vn', 'authenticated'),
        ('200d9302-c5b6-4f2c-8eca-9c51cf6284fc', 'peer2@vione.vn', 'authenticated'),
        ('dc038648-67cf-455b-a93e-489ad421b25a', 'peer3@vione.vn', 'authenticated'),
        ('a58e5cff-28d3-4439-9c50-a787731c1323', 'peer4@vione.vn', 'authenticated')
      ON CONFLICT (id) DO NOTHING;

      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT null::uuid; $$;

      CREATE SCHEMA IF NOT EXISTS storage;
      CREATE TABLE IF NOT EXISTS storage.buckets (
        id text PRIMARY KEY,
        name text NOT NULL,
        owner uuid,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        public boolean DEFAULT false
      );
      CREATE TABLE IF NOT EXISTS storage.objects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket_id text REFERENCES storage.buckets(id),
        name text,
        owner uuid,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        last_accessed_at timestamptz DEFAULT now(),
        metadata jsonb
      );

      CREATE OR REPLACE FUNCTION storage.foldername(name text)
      RETURNS text[] LANGUAGE plpgsql AS $$
      BEGIN
        RETURN string_to_array(name, '/');
      END;
      $$;
    `);

    // 4. Chạy migration từ supabase/migrations
    const migrationsDir = path.join(__dirname, '../../supabase/migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
      console.log(`4. Tìm thấy ${files.length} tệp migration SQL. Đang thực thi...`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = path.join(migrationsDir, file);
        let sql = fs.readFileSync(filePath, 'utf8');

        sql = sql
          .replace(/^CREATE EXTENSION IF NOT EXISTS pg_cron;?/gim, '-- CREATE EXTENSION IF NOT EXISTS pg_cron;')
          .replace(/^CREATE EXTENSION IF NOT EXISTS pg_net;?/gim, '-- CREATE EXTENSION IF NOT EXISTS pg_net;')
          .replace(/^CREATE EXTENSION IF NOT EXISTS vector;?/gim, '-- CREATE EXTENSION IF NOT EXISTS vector;')
          .replace(/\bvector\(1536\)/gi, 'real[]')
          .replace(/^select\s+cron\.schedule\([\s\S]*?\);/gim, '/* select cron.schedule(...) */')
          .replace(/^select\s+cron\.unschedule\([\s\S]*?\);/gim, '/* select cron.unschedule(...) */')
          .replace(/^perform\s+cron\.schedule\([\s\S]*?\);/gim, '/* perform cron.schedule(...) */')
          .replace(/^perform\s+cron\.unschedule\([\s\S]*?\);/gim, '/* perform cron.unschedule(...) */')
          .replace(/^CREATE\s+INDEX[\s\S]*?USING\s+hnsw[\s\S]*?;/gim, '/* CREATE INDEX USING HNSW */')
          .replace(/^SELECT\s+net\.http_post\([\s\S]*?\);/gim, '/* SELECT net.http_post(...) */')
          .replace(/^ALTER\s+PUBLICATION\s+[\s\S]*?;/gim, '-- ALTER PUBLICATION COMMITTED OUT')
          .replace(/^GRANT\s+[\s\S]*?;/gim, '-- GRANT COMMITTED OUT')
          .replace(/^REVOKE\s+[\s\S]*?;/gim, '-- REVOKE COMMITTED OUT')
          .replace(/^ALTER\s+TABLE\s+[\w."]+\s+(ENABLE|FORCE)\s+ROW\s+LEVEL\s+SECURITY;?/gim, '-- ALTER RLS COMMITTED OUT')
          .replace(/^CREATE\s+POLICY\s+[\s\S]*?;/gim, '/* CREATE POLICY COMMITTED OUT */')
          .replace(/^DROP\s+POLICY\s+[\s\S]*?;/gim, '/* DROP POLICY COMMITTED OUT */')
          .replace(/^ALTER\s+POLICY\s+[\s\S]*?;/gim, '/* ALTER POLICY COMMITTED OUT */');

        try {
          await client.query(sql);
        } catch (mErr) {
          // Bỏ qua lỗi trùng lặp đối tượng đã tồn tại
          if (!mErr.message.includes('already exists')) {
            console.warn(`[Cảnh báo ${file}]:`, mErr.message.substring(0, 120));
          }
        }
      }
      console.log('Hoàn thành chạy migrations!');
    }

    // 5. Thêm các cột & bảng cần thiết cho hệ thống CRM Standalone
    console.log('5. Cập nhật schema CRM...');
    await client.query(`
      ALTER TABLE public.members ADD COLUMN IF NOT EXISTS department text;
      ALTER TABLE public.members ADD COLUMN IF NOT EXISTS executive_role text;
      ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS department text;
      ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS executive_role text;

      ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_by_id text;
      ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_by_name text;
      ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;
      ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_phone text;
      ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS claimed_company text;

      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee bigint DEFAULT 0;
      ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seating_plan jsonb;

      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'transfer';
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_amount bigint DEFAULT 0;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS payment_deadline timestamp with time zone;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS reminder_count integer DEFAULT 0;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS last_reminded_at timestamp with time zone;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS seat_assignment text;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS qr_payload text;
      ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone;

      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS advance_amount bigint DEFAULT 0;
      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS refund_amount bigint DEFAULT 0;
      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS invoice_url text;
      ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recipient text;

      ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS department text;
      ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS target_members jsonb;
      ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS zoom_url text;
      ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS cancel_reason text;

      ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'all';
      ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS lucky_draw jsonb;
    `);

    // 6. Kiểm tra tổng số bảng
    const tablesRes = await client.query(`
      SELECT count(*) as total FROM information_schema.tables WHERE table_schema = 'public'
    `);
    console.log(`\n=== KẾT QUẢ: DATABASE ${STANDALONE_DB_NAME} ĐÃ CÓ ${tablesRes.rows[0].total} BẢNG PUBLIC ===`);

  } catch (err) {
    console.error('Lỗi thiết lập database:', err);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
