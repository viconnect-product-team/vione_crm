import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private clients: { name: string; client: Minio.Client }[] = [];
  private readonly bucketName = process.env.MINIO_BUCKET || 'vione-bucket';

  async onModuleInit() {
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    const envEndpoint = process.env.MINIO_ENDPOINT;
    const envPort = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : undefined;
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    const candidateConfigs: { name: string; endPoint: string; port: number }[] = [];

    // 1. Env configured endpoint (Highest Priority)
    if (envEndpoint) {
      candidateConfigs.push({
        name: `env(${envEndpoint}:${envPort || 9000})`,
        endPoint: envEndpoint,
        port: envPort || 9000,
      });
    }

    // 2. Docker container aliases in vione-network (Fastest & direct inside docker container network)
    candidateConfigs.push({
      name: 'docker-alias(vione-standalone-minio-prod:9000)',
      endPoint: 'vione-standalone-minio-prod',
      port: 9000,
    });
    candidateConfigs.push({
      name: 'docker-alias(vione-standalone-minio:9000)',
      endPoint: 'vione-standalone-minio',
      port: 9000,
    });
    candidateConfigs.push({
      name: 'docker-alias(minio:9000)',
      endPoint: 'minio',
      port: 9000,
    });

    // 3. Direct server public IP on port 9060 (Dedicated port for ViOne Standalone MinIO)
    candidateConfigs.push({
      name: 'host-public(14.225.217.232:9060)',
      endPoint: '14.225.217.232',
      port: 9060,
    });

    // 4. Docker bridge host gateway on port 9060
    candidateConfigs.push({
      name: 'docker-bridge(172.17.0.1:9060)',
      endPoint: '172.17.0.1',
      port: 9060,
    });

    // Deduplicate by endPoint:port
    const seen = new Set<string>();
    for (const conf of candidateConfigs) {
      const key = `${conf.endPoint}:${conf.port}`;
      if (seen.has(key)) continue;
      seen.add(key);

      try {
        const client = new Minio.Client({
          endPoint: conf.endPoint,
          port: conf.port,
          useSSL,
          accessKey,
          secretKey,
        });
        this.clients.push({ name: conf.name, client });
      } catch (e: any) {
        console.warn(`MinIO client setup notice for ${conf.name}:`, e?.message);
      }
    }

    // Check bucket existence on active client
    for (const entry of this.clients) {
      try {
        const exists = await entry.client.bucketExists(this.bucketName);
        if (!exists) {
          await entry.client.makeBucket(this.bucketName, 'us-east-1');
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucketName}/*`],
              },
            ],
          };
          await entry.client.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        }
        break;
      } catch {
        // Continue to check next client
      }
    }
  }

  async uploadFile(filename: string, fileBuffer: Buffer, mimeType: string): Promise<string | null> {
    let lastErr: any = null;

    for (let i = 0; i < this.clients.length; i++) {
      const entry = this.clients[i];
      try {
        await entry.client.putObject(
          this.bucketName,
          filename,
          fileBuffer,
          fileBuffer.length,
          { 'Content-Type': mimeType }
        );
        // Move successful client to the front of the list for faster subsequent operations
        if (i > 0) {
          this.clients.splice(i, 1);
          this.clients.unshift(entry);
        }
        return `/upload/file/${filename}`;
      } catch (err: any) {
        lastErr = err;
      }
    }

    console.warn(`MinIO upload unreachable or failed across all endpoints (${lastErr?.message || 'Unreachable'}). Falling back to local disk storage.`);
    return null;
  }

  async getFileStream(filename: string): Promise<any> {
    for (let i = 0; i < this.clients.length; i++) {
      const entry = this.clients[i];
      try {
        const stream = await entry.client.getObject(this.bucketName, filename);
        if (stream) {
          if (i > 0) {
            this.clients.splice(i, 1);
            this.clients.unshift(entry);
          }
          return stream;
        }
      } catch {
        // try next client
      }
    }
    return null;
  }

  async deleteFile(filename: string): Promise<void> {
    for (const entry of this.clients) {
      try {
        await entry.client.removeObject(this.bucketName, filename);
        return;
      } catch {}
    }
  }
}
