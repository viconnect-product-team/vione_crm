const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true'
    }
  }
});

async function test() {
  await prisma.$connect();
  console.log('Prisma connected!');

  // Lấy 1 user từ DB
  const users = await prisma.$queryRaw`SELECT id FROM auth.users LIMIT 1`;
  const userId = users[0].id;
  console.log('Testing with userId:', userId);

  // Test 1: getOrCreateMyShareLink
  console.log('--- Testing getOrCreateMyShareLink ---');
  try {
    const existingRows = await prisma.$queryRaw`
      SELECT id FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    let identityId;
    const now = new Date();

    if (existingRows.length === 0) {
      identityId = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO public.business_identities (id, owner_user_id, status, created_at, updated_at)
        VALUES (${identityId}::uuid, ${userId}::uuid, 'active', ${now}, ${now})
      `;
    } else {
      identityId = existingRows[0].id;
    }

    const links = await prisma.$queryRaw`
      SELECT * FROM public.identity_share_links
      WHERE owner_user_id = ${userId}::uuid AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);

    if (links.length > 0) {
      console.log('Share link found:', links[0].public_token);
    } else {
      const newLinkToken = crypto.randomBytes(32).toString('hex');
      const linkId = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO public.identity_share_links (id, identity_id, owner_user_id, public_token, status, created_at)
        VALUES (${linkId}::uuid, ${identityId}::uuid, ${userId}::uuid, ${newLinkToken}, 'active', ${now})
      `;
      console.log('Share link created:', newLinkToken);
    }
  } catch (err) {
    console.error('getOrCreateMyShareLink ERROR:', err);
  }

  // Test 2: upsertMyIdentity với dữ liệu giả lập từ form
  console.log('--- Testing upsertMyIdentity ---');
  try {
    const input = {
      displayName: 'Phạm Văn Vũ Test',
      headline: 'Chủ tịch ViOne',
      jobTitle: 'CEO',
      companyName: 'ViOne',
      bio: 'Test bio',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      primaryEmail: 'test@vione.vn',
      primaryPhone: '0983000000',
      website: '',
      linkedinUrl: '',
      address: 'Hà Nội',
      city: 'Hà Nội',
      countryCode: 'VN',
      preferredLocale: 'vi'
    };

    const existingRows = await prisma.$queryRaw`
      SELECT * FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    const now = new Date();

    if (existingRows.length === 0) {
      const id = crypto.randomUUID();
      const finalData = {
        id,
        owner_user_id: userId,
        display_name: input.displayName || null,
        headline: input.headline || null,
        job_title: input.jobTitle || null,
        company_name: input.companyName || null,
        bio: input.bio || null,
        avatar_url: input.avatarUrl || null,
        primary_email: input.primaryEmail || null,
        primary_phone: input.primaryPhone || null,
        website: input.website || null,
        linkedin_url: input.linkedinUrl || null,
        address: input.address || null,
        city: input.city || null,
        country_code: input.countryCode || null,
        preferred_locale: input.preferredLocale || null,
        status: 'active',
        created_at: now,
        updated_at: now,
      };

      await prisma.$executeRaw`
        INSERT INTO public.business_identities (
          id, owner_user_id, display_name, headline, job_title, company_name, bio, avatar_url,
          primary_email, primary_phone, website, linkedin_url, address, city, country_code,
          preferred_locale, status, created_at, updated_at
        ) VALUES (
          ${finalData.id}::uuid, ${finalData.owner_user_id}::uuid, ${finalData.display_name}, ${finalData.headline},
          ${finalData.job_title}, ${finalData.company_name}, ${finalData.bio},
          ${finalData.avatar_url}, ${finalData.primary_email}, ${finalData.primary_phone},
          ${finalData.website}, ${finalData.linkedin_url}, ${finalData.address},
          ${finalData.city}, ${finalData.country_code}, ${finalData.preferred_locale},
          ${finalData.status}, ${finalData.created_at}, ${finalData.updated_at}
        )
      `;

      await prisma.$executeRaw`
        UPDATE public.user_profiles SET
          avatar_url = ${finalData.avatar_url}
        WHERE user_id = ${userId}::uuid
      `;
      console.log('INSERT SUCCESS');
    } else {
      const existing = existingRows[0];
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

      console.log('Executing UPDATE with finalData:', finalData);

      await prisma.$executeRaw`
        UPDATE public.business_identities SET
          display_name = ${finalData.display_name},
          headline = ${finalData.headline},
          job_title = ${finalData.job_title},
          company_name = ${finalData.company_name},
          bio = ${finalData.bio},
          avatar_url = ${finalData.avatar_url},
          primary_email = ${finalData.primary_email},
          primary_phone = ${finalData.primary_phone},
          website = ${finalData.website},
          linkedin_url = ${finalData.linkedin_url},
          address = ${finalData.address},
          city = ${finalData.city},
          country_code = ${finalData.country_code},
          preferred_locale = ${finalData.preferred_locale},
          updated_at = ${now}
        WHERE id = ${existing.id}::uuid
      `;

      await prisma.$executeRaw`
        UPDATE public.user_profiles SET
          avatar_url = ${finalData.avatar_url}
        WHERE user_id = ${userId}::uuid
      `;
      console.log('UPDATE SUCCESS');
    }
  } catch (err) {
    console.error('upsertMyIdentity ERROR:', err);
  }

  await prisma.$disconnect();
}

test().catch(console.error);
