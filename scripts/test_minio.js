const Minio = require('minio');
async function test() {
  const minioClient = new Minio.Client({
    endPoint: '14.225.217.232',
    port: 9050,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
  });
  console.log('Testing bucketExists...');
  const exists = await minioClient.bucketExists('vione-bucket');
  console.log('vione-bucket exists:', exists);
  if (!exists) {
    await minioClient.makeBucket('vione-bucket', 'us-east-1');
    console.log('Created vione-bucket!');
  }
  const objects = [];
  const stream = minioClient.listObjects('vione-bucket', '', true);
  stream.on('data', (obj) => objects.push(obj.name));
  stream.on('end', () => console.log('Objects in bucket (count ' + objects.length + '):', objects.slice(0, 10)));
  stream.on('error', (err) => console.error('Stream error:', err));
}
test().catch(console.error);
