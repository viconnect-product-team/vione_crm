const { Client } = require('pg');

async function debugUpsert() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();

  const userId = '65d29757-f55e-4c4d-9280-54cd2f0358d4';
  const input = {
    displayName: 'Phạm Văn Vũ Test',
    headline: 'CEO',
    avatarUrl: '/upload/file/avatars/test.jpg'
  };

  console.log('--- Step 1: Query existing business_identities ---');
  const existingRows = await client.query('SELECT * FROM public.business_identities WHERE owner_user_id = $1::uuid LIMIT 1', [userId]);
  console.log('existingRows length:', existingRows.rows.length);
  const existing = existingRows.rows[0];
  console.log('existing data:', existing);

  console.log('--- Step 2: Prepare finalData ---');
  const now = new Date();
  const finalData = {
    display_name: input.displayName !== undefined ? input.displayName : existing.display_name,
    headline: input.headline !== undefined ? input.headline : existing.headline,
    job_title: input.jobTitle !== undefined ? input.jobTitle : existing.job_title,
    company_name: input.companyName !== undefined ? input.companyName : existing.company_name,
    bio: input.bio !== undefined ? input.bio : existing.bio,
    avatar_url: input.avatarUrl !== undefined ? input.avatarUrl : existing.avatar_url,
    primary_email: input.primaryEmail !== undefined ? input.primaryEmail : existing.primary_email,
    primary_phone: input.primaryPhone !== undefined ? input.primaryPhone : existing.primary_phone,
    website: input.website !== undefined ? input.website : existing.website,
    linkedin_url: input.linkedinUrl !== undefined ? input.linkedinUrl : existing.linkedin_url,
    address: input.address !== undefined ? input.address : existing.address,
    city: input.city !== undefined ? input.city : existing.city,
    country_code: input.countryCode !== undefined ? input.countryCode : existing.country_code,
    preferred_locale: input.preferredLocale !== undefined ? input.preferredLocale : existing.preferred_locale,
  };
  console.log('finalData:', finalData);

  console.log('--- Step 3: Run UPDATE business_identities ---');
  try {
    const resUpdate = await client.query(`
      UPDATE public.business_identities SET
        display_name = $1,
        headline = $2,
        job_title = $3,
        company_name = $4,
        bio = $5,
        avatar_url = $6,
        primary_email = $7,
        primary_phone = $8,
        website = $9,
        linkedin_url = $10,
        address = $11,
        city = $12,
        country_code = $13,
        preferred_locale = $14,
        updated_at = $15
      WHERE id = $16::uuid
    `, [
      finalData.display_name, finalData.headline, finalData.job_title, finalData.company_name,
      finalData.bio, finalData.avatar_url, finalData.primary_email, finalData.primary_phone,
      finalData.website, finalData.linkedin_url, finalData.address, finalData.city,
      finalData.country_code, finalData.preferred_locale, now, existing.id
    ]);
    console.log('Update business_identities OK! rowCount:', resUpdate.rowCount);
  } catch (err) {
    console.error('Update business_identities FAILED:', err);
  }

  console.log('--- Step 4: Run UPDATE user_profiles ---');
  try {
    const resProfile = await client.query(`
      UPDATE public.user_profiles SET
        avatar_url = $1
      WHERE user_id = $2::uuid
    `, [finalData.avatar_url, userId]);
    console.log('Update user_profiles OK! rowCount:', resProfile.rowCount);
  } catch (err) {
    console.error('Update user_profiles FAILED:', err);
  }

  console.log('--- Step 5: Check Prisma client in vione_app_be ---');
  // Xem Prisma executeRaw hoạt động ra sao
  await client.end();
}

debugUpsert().catch(console.error);
