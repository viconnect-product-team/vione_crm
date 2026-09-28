import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import * as net from 'net';

function checkPortOpen(host: string, port: number, timeoutMs = 400): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const cleanup = (isOpen: boolean) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(isOpen);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => cleanup(true));
    socket.once('timeout', () => cleanup(false));
    socket.once('error', () => cleanup(false));
    try {
      socket.connect(port, host);
    } catch {
      cleanup(false);
    }
  });
}

@Injectable()
export class MinioService implements OnModuleInit {
  private clients: { name: string; client: Minio.Client }[] = [];
  private readonly bucketName = process.env.MINIO_BUCKET || 'vione-standalone-bucket';
  private readonly fallbackBuckets = ['vione-standalone-bucket', 'vione-bucket'];
  private minioOffline = true;
  private lastInitTime = 0;

  async onModuleInit() {
    await this.initMinio();
  }

  getBucketName(): string {
    return this.bucketName;
  }

  isOnline(): boolean {
    return !this.minioOffline && this.clients.length > 0;
  }

  async initMinio(): Promise<boolean> {
    this.lastInitTime = Date.now();
    const envAccessKey = process.env.MINIO_ACCESS_KEY;
    const envSecretKey = process.env.MINIO_SECRET_KEY;
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

    // 2. Docker container aliases on vione-network (resolve in ~1ms in Docker)
    candidateConfigs.push({
      name: 'docker-alias(vione-standalone-minio-prod:9000)',
      endPoint: 'vione-standalone-minio-prod',
      port: 9000,
    });
    candidateConfigs.push({
      name: 'docker-alias(minio:9000)',
      endPoint: 'minio',
      port: 9000,
    });
    candidateConfigs.push({
      name: 'docker-alias(vione-standalone-minio:9000)',
      endPoint: 'vione-standalone-minio',
      port: 9000,
    });

    // 3. Remote dev server MinIO (Port 9060 and 9000 on 14.225.217.232)
    candidateConfigs.push({
      name: 'remote-server(14.225.217.232:9060)',
      endPoint: '14.225.217.232',
      port: 9060,
    });
    candidateConfigs.push({
      name: 'remote-server(14.225.217.232:9000)',
      endPoint: '14.225.217.232',
      port: 9000,
    });

    // 4. Localhost on port 9060 or 9000
    candidateConfigs.push({
      name: 'local(127.0.0.1:9060)',
      endPoint: '127.0.0.1',
      port: 9060,
    });
    candidateConfigs.push({
      name: 'local(127.0.0.1:9000)',
      endPoint: '127.0.0.1',
      port: 9000,
    });

    // Credential candidates to attempt
    const credentialPairs: { accessKey: string; secretKey: string }[] = [];
    if (envAccessKey && envSecretKey) {
      credentialPairs.push({ accessKey: envAccessKey, secretKey: envSecretKey });
    }
    credentialPairs.push({ accessKey: 'vioneadmin', secretKey: 'vioneadmin' });
    credentialPairs.push({ accessKey: 'minioadmin', secretKey: 'minioadmin' });

    const newClients: { name: string; client: Minio.Client }[] = [];
    const seenEndpoints = new Set<string>();

    for (const conf of candidateConfigs) {
      const epKey = `${conf.endPoint}:${conf.port}`;
      if (seenEndpoints.has(epKey)) continue;
      seenEndpoints.add(epKey);

      // Fast non-blocking socket probe (400ms)
      const isOpen = await checkPortOpen(conf.endPoint, conf.port, 400);
      if (!isOpen) {
        continue;
      }

      // Try credential pairs on this open endpoint
      for (const cred of credentialPairs) {
        try {
          const client = new Minio.Client({
            endPoint: conf.endPoint,
            port: conf.port,
            useSSL,
            accessKey: cred.accessKey,
            secretKey: cred.secretKey,
          });

          // Verify connectivity and list buckets
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Bucket list timeout')), 1200)
          );
          const buckets = await Promise.race([client.listBuckets(), timeoutPromise]);

          // Ensure buckets exist
          const allBuckets = Array.from(new Set([this.bucketName, ...this.fallbackBuckets]));
          for (const bName of allBuckets) {
            const exists = buckets.some((b: any) => b.name === bName);
            if (!exists) {
              try {
                await client.makeBucket(bName, 'us-east-1');
              } catch {}
            }
          }

          newClients.push({ name: `${conf.name}[${cred.accessKey}]`, client });
          console.log(`[MinioService] Connected successfully to MinIO at ${conf.name} (user: ${cred.accessKey})`);
          break; // Connected with valid creds for this endpoint
        } catch (e: any) {
          // Try next cred
        }
      }
    }

    if (newClients.length > 0) {
      this.clients = newClients;
      this.minioOffline = false;
      return true;
    }

    this.minioOffline = true;
    console.warn('[MinioService] No active MinIO instance reachable across candidate endpoints.');
    return false;
  }

  private async ensureConnected(): Promise<boolean> {
    if (!this.minioOffline && this.clients.length > 0) {
      return true;
    }
    // Re-attempt init if last attempt was > 3 seconds ago
    if (Date.now() - this.lastInitTime > 3000) {
      return this.initMinio();
    }
    return false;
  }

  async uploadFile(filename: string, fileBuffer: Buffer, mimeType: string): Promise<string | null> {
    await this.ensureConnected();

    if (this.clients.length === 0) {
      return null;
    }

    let lastErr: any = null;

    for (let i = 0; i < this.clients.length; i++) {
      const entry = this.clients[i];
      try {
        const uploadPromise = entry.client.putObject(
          this.bucketName,
          filename,
          fileBuffer,
          fileBuffer.length,
          { 'Content-Type': mimeType }
        );
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MinIO putObject timeout (3000ms)')), 3000)
        );
        await Promise.race([uploadPromise, timeoutPromise]);

        if (i > 0) {
          this.clients.splice(i, 1);
          this.clients.unshift(entry);
        }
        this.minioOffline = false;
        console.log(`[MinioService] Stored '${filename}' in MinIO bucket '${this.bucketName}' via ${entry.name}`);
        return `/upload/file/${filename}`;
      } catch (err: any) {
        lastErr = err;
      }
    }

    console.warn(`[MinioService] Upload failed across all endpoints (${lastErr?.message || 'Unreachable'}).`);
    return null;
  }

  async getFileStream(filename: string): Promise<any> {
    await this.ensureConnected();

    const bucketsToTry = Array.from(new Set([this.bucketName, ...this.fallbackBuckets]));

    for (let i = 0; i < this.clients.length; i++) {
      const entry = this.clients[i];
      for (const bName of bucketsToTry) {
        try {
          const stream = await entry.client.getObject(bName, filename);
          if (stream) {
            if (i > 0) {
              this.clients.splice(i, 1);
              this.clients.unshift(entry);
            }
            return stream;
          }
        } catch {
          // try next bucket or client
        }
      }
    }
    return null;
  }

  async deleteFile(filename: string): Promise<void> {
    await this.ensureConnected();

    const bucketsToTry = Array.from(new Set([this.bucketName, ...this.fallbackBuckets]));

    for (const entry of this.clients) {
      for (const bName of bucketsToTry) {
        try {
          await entry.client.removeObject(bName, filename);
        } catch {}
      }
    }
  }
}
