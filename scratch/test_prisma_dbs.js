const { PrismaClient } = require('@prisma/client');

async function testDb(dbName) {
  console.log(`\n=== Testing Prisma on [${dbName}] ===`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/${dbName}?schema=public&pgbouncer=true`
      }
    }
  });

  const userId = '65d29757-f55e-4c4d-9280-54cd2f0358d4';
  const input = {
    displayName: 'Phạm Văn Vũ Test',
    headline: 'CEO',
    avatarUrl: '/upload/file/avatars/test.jpg'
  };

  try {
    const existingRows = await prisma.$queryRaw`
      SELECT * FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(e => { console.error('Query error:', e); return []; });

    console.log('existingRows:', existingRows);
    if (existingRows.length > 0) {
      const existing = existingRows[0];
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

      console.log('Running Prisma $executeRaw UPDATE...');
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
      console.log('UPDATE business_identities SUCCESS!');

      await prisma.$executeRaw`
        UPDATE public.user_profiles SET
          avatar_url = ${finalData.avatar_url}
        WHERE user_id = ${userId}::uuid
      `;
      console.log('UPDATE user_profiles SUCCESS!');
    }
  } catch (err) {
    console.error(`ERROR on [${dbName}]:`, err);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await testDb('vione_project');
  await testDb('vione_standalone_app');
  await testDb('vione_app');
}

run();
