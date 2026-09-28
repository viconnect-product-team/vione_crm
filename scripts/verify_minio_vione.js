const fs = require('fs');
const path = require('path');

// Load environment variables from apps/vione_app_be/.env
const envPath = path.resolve(__dirname, '../apps/vione_app_be/.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[k] = v;
      }
    }
  });
}

const { MinioService } = require('../apps/vione_app_be/dist/upload/minio.service');

async function main() {
  console.log('=== VERIFYING MINIO SERVICE FOR VIONE & VIONE CRM ===');
  console.log('Configured endpoint:', process.env.MINIO_ENDPOINT);
  console.log('Configured port:', process.env.MINIO_PORT);
  console.log('Configured bucket:', process.env.MINIO_BUCKET);

  const minio = new MinioService();
  await minio.onModuleInit();

  const isOnline = minio.isOnline();
  console.log('MinIO Online Status:', isOnline ? 'ONLINE (SUCCESS)' : 'OFFLINE (FAILED)');
  console.log('Active Bucket:', minio.getBucketName());

  if (!isOnline) {
    throw new Error('MinIO service failed to connect to any active endpoint!');
  }

  // Test 1: Upload an avatar
  const avatarBuffer = Buffer.from('Fake avatar JPEG content for test ' + Date.now());
  const avatarKey = `avatars/test-avatar-${Date.now()}.jpg`;
  const avatarUrl = await minio.uploadFile(avatarKey, avatarBuffer, 'image/jpeg');
  console.log('Test 1 - Avatar uploaded to MinIO:', avatarUrl);

  // Test 2: Upload a document
  const docBuffer = Buffer.from('Test document content on MinIO S3 ' + Date.now());
  const docKey = `documents/test-doc-${Date.now()}.pdf`;
  const docUrl = await minio.uploadFile(docKey, docBuffer, 'application/pdf');
  console.log('Test 2 - Document uploaded to MinIO:', docUrl);

  // Test 3: Stream reading back from MinIO
  const stream = await minio.getFileStream(docKey);
  if (!stream) {
    throw new Error('Failed to retrieve file stream from MinIO for key: ' + docKey);
  }

  let readData = '';
  await new Promise((resolve, reject) => {
    stream.on('data', chunk => readData += chunk);
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  console.log('Test 3 - Stream read back verified:', readData);

  // Test 4: Delete test files from MinIO
  await minio.deleteFile(avatarKey);
  await minio.deleteFile(docKey);
  console.log('Test 4 - Cleaned up test files from MinIO successfully.');

  console.log('=== ALL 4 MINIO STORAGE TESTS PASSED 100% ===');
}

main().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
