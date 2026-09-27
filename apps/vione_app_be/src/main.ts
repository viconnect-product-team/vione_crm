import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

function loadEnvFile(envPath: string) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

// Load root .env
loadEnvFile(path.join(__dirname, '../../../../.env'));
loadEnvFile(path.join(process.cwd(), '.env'));

function probeTcp(host: string, port: number, timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const cleanup = (result: boolean) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
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

async function resolveDatabaseConfig() {
  const remoteUrl =
    process.env.REMOTE_DATABASE_URL ||
    'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true';
  const localUrl =
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@127.0.0.1:6433/vione_project?schema=public';

  const isRemoteReachable = await probeTcp('113.20.107.184', 6432, 1200);

  if (isRemoteReachable) {
    process.env.DATABASE_URL = remoteUrl;
    console.log('\x1b[32m%s\x1b[0m', '================================================================');
    console.log('\x1b[32m%s\x1b[0m', '🌐 [Database Auto-Switch] ĐÃ PHÁT HIỆN INTERNET: Trỏ vào Database Online');
    console.log('\x1b[32m%s\x1b[0m', '   Target: 113.20.107.184:6432/vione_project');
    console.log('\x1b[32m%s\x1b[0m', '================================================================');
  } else {
    process.env.DATABASE_URL = localUrl;
    console.log('\x1b[33m%s\x1b[0m', '================================================================');
    console.log('\x1b[33m%s\x1b[0m', '🏠 [Database Auto-Switch] MẤT MẠNG / OFFLINE: Tự động chuyển Database Local');
    console.log('\x1b[33m%s\x1b[0m', '   Target: 127.0.0.1:6433/vione_project (vione-connect-db-local)');
    console.log('\x1b[33m%s\x1b[0m', '================================================================');
  }
}

import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { createVietnameseValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  await resolveDatabaseConfig();
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Đăng ký bộ chuẩn hóa Validate và Bắt lỗi tiếng Việt toàn cục
  app.useGlobalPipes(createVietnameseValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4001;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}/api`);
}
void bootstrap();

