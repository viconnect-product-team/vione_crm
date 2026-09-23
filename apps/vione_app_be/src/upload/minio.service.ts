import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
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
  private readonly bucketName = process.env.MINIO_BUCKET || 'vione-bucket';
  private minioOffline = true; // Default to offline until proven reachable
  private lastOfflineTime = 0;

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

    // 2. Localhost on port 9060 or 9000
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

    // 3. Docker container aliases only in Linux/Docker environment (never on Windows host to avoid DNS resolution hangs)
    const isInsideDocker = process.platform === 'linux' && (Boolean(process.env.DOCKER_CONTAINER) || Boolean(process.env.KUBERNETES_SERVICE_HOST));
    if (isInsideDocker) {
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
    }

    // Deduplicate by endPoint:port
    const seen = new Set<string>();
    for (const conf of candidateConfigs) {
      const key = `${conf.endPoint}:${conf.port}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Fast non-blocking socket probe (400ms)
      const isOpen = await checkPortOpen(conf.endPoint, conf.port, 400);
      if (!isOpen) {
        continue;
      }

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

    if (this.clients.length === 0) {
      this.minioOffline = true;
      this.lastOfflineTime = Date.now();
      console.log('[MinioService] No active MinIO instance detected. File uploads will instantly use local disk storage.');
      return;
    }

    // Check bucket existence on reachable client
    for (const entry of this.clients) {
      try {
        const checkBucketPromise = entry.client.bucketExists(this.bucketName);
        const timeoutPromise = new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Bucket check timeout')), 1000)
        );
        const exists = await Promise.race([checkBucketPromise, timeoutPromise]);
        if (!exists) {
          await entry.client.makeBucket(this.bucketName, 'us-east-1');
        }
        this.minioOffline = false;
        console.log(`[MinioService] Connected to active MinIO at ${entry.name}`);
        break;
      } catch {
        // Continue to check next client
      }
    }
  }

  async uploadFile(filename: string, fileBuffer: Buffer, mimeType: string): Promise<string | null> {
    if (this.minioOffline || this.clients.length === 0) {
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
          setTimeout(() => reject(new Error('MinIO connection timeout (1500ms)')), 1500)
        );
        await Promise.race([uploadPromise, timeoutPromise]);

        if (i > 0) {
          this.clients.splice(i, 1);
          this.clients.unshift(entry);
        }
        this.minioOffline = false;
        return `/upload/file/${filename}`;
      } catch (err: any) {
        lastErr = err;
      }
    }

    this.minioOffline = true;
    this.lastOfflineTime = Date.now();
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
