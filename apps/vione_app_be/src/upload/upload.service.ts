import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { MinioService } from './minio.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly minioService: MinioService,
    private readonly prisma: PrismaService,
  ) {}

  private async saveToLocalDisk(subfolder: string, filename: string, buffer: Buffer): Promise<string> {
    const os = require('os');
    const candidates = [
      path.join(process.cwd(), 'uploads', subfolder),
      path.join(process.cwd(), 'dist', 'uploads', subfolder),
      path.join(os.tmpdir(), 'vione_uploads', subfolder),
      path.join('/app', 'uploads', subfolder),
      path.join('/tmp', 'uploads', subfolder),
    ];
    let saved = false;
    for (const uploadDir of candidates) {
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, buffer);
        saved = true;
        break;
      } catch (err: any) {
        console.warn(`Local disk write failed for ${uploadDir}:`, err?.message);
      }
    }
    if (!saved) {
      throw new Error('All local disk candidate locations failed to write');
    }
    return `/upload/file/${subfolder}/${filename}`;
  }

  async saveAvatar(file: any, userId: string): Promise<string> {
    const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const baseFilename = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${fileExt}`;
    const safeFilename = `avatars/${baseFilename}`;

    let saved = false;
    let url: string | null = null;

    // 1. Ưu tiên tải trực tiếp lên MinIO (S3 Object Storage)
    try {
      const minioUrl = await this.minioService.uploadFile(safeFilename, file.buffer, file.mimetype);
      if (minioUrl) {
        url = minioUrl;
        saved = true;
      }
    } catch (minioErr: any) {
      console.warn('MinIO upload unreachable/failed, fallback to disk storage:', minioErr?.message);
    }

    // 2. Chỉ ghi vào ổ đĩa cục bộ làm fallback nếu MinIO không khả dụng
    if (!saved) {
      try {
        url = await this.saveToLocalDisk('avatars', baseFilename, file.buffer);
        saved = true;
      } catch (diskErr: any) {
        console.warn('Local disk write notice in saveAvatar:', diskErr?.message);
      }
    }

    if (!saved || !url) {
      throw new InternalServerErrorException('Không thể lưu trữ tệp ảnh lên hệ thống. Vui lòng thử lại sau.');
    }
    
    // Save upload metadata (non-fatal if uuid check fails)
    try {
      const uploadId = randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.user_uploads (id, user_id, file_path, filename, original_name, mime_type, size, created_at, updated_at)
        VALUES (${uploadId}::uuid, ${userId}::uuid, ${url}, ${safeFilename}, ${file.originalname}, ${file.mimetype}, ${file.size}, NOW(), NOW())
      `;
    } catch (err: any) {
      console.warn('user_uploads metadata insert notice:', err?.message);
    }

    // Save url to database user_profiles
    await this.prisma.$executeRaw`
      UPDATE public.user_profiles
      SET avatar_url = ${url}
      WHERE user_id = ${userId}::uuid
    `.catch(() => null);

    // Save url to database members
    await this.prisma.$executeRaw`
      UPDATE public.members
      SET avatar = ${url}
      WHERE user_id = ${userId}::uuid OR id = ${userId}::uuid
    `.catch(() => null);
    
    // Save url to database business_identities
    await this.prisma.$executeRaw`
      UPDATE public.business_identities
      SET avatar_url = ${url}
      WHERE owner_user_id = ${userId}::uuid
    `.catch(() => null);

    // Save url to database member_business_cards
    await this.prisma.$executeRaw`
      UPDATE public.member_business_cards
      SET avatar_url = ${url}
      WHERE owner_user_id = ${userId}::uuid
    `.catch(() => null);

    // Save url to database vione_users (synchronize with dev server / local)
    await this.prisma.$executeRaw`
      UPDATE public.vione_users
      SET avatar_url = ${url}
      WHERE id = ${userId}::uuid
    `.catch(() => null);
    
    return url;
  }

  async saveFile(file: any, userId: string, folder = 'documents'): Promise<string> {
    const fileExt = path.extname(file.originalname).toLowerCase() || '.bin';
    const baseFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${fileExt}`;
    const safeFilename = `${folder}/${baseFilename}`;

    let saved = false;
    let url: string | null = null;

    // 1. Ưu tiên tải trực tiếp lên MinIO (S3 Object Storage)
    try {
      const minioUrl = await this.minioService.uploadFile(safeFilename, file.buffer, file.mimetype);
      if (minioUrl) {
        url = minioUrl;
        saved = true;
      }
    } catch (minioErr: any) {
      console.warn('MinIO upload unreachable/failed, fallback to disk storage:', minioErr?.message);
    }

    // 2. Chỉ ghi vào ổ đĩa cục bộ làm fallback nếu MinIO không khả dụng
    if (!saved) {
      try {
        url = await this.saveToLocalDisk(folder, baseFilename, file.buffer);
        saved = true;
      } catch (diskErr: any) {
        console.warn('Local disk write notice in saveFile:', diskErr?.message);
      }
    }

    if (!saved || !url) {
      throw new InternalServerErrorException('Không thể lưu trữ tệp tin lên hệ thống. Vui lòng thử lại sau.');
    }

    // Save upload metadata
    try {
      const uploadId = randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.user_uploads (id, user_id, file_path, filename, original_name, mime_type, size, created_at, updated_at)
        VALUES (${uploadId}::uuid, ${userId}::uuid, ${url}, ${safeFilename}, ${file.originalname}, ${file.mimetype}, ${file.size}, NOW(), NOW())
      `;
    } catch (err: any) {
      console.warn('user_uploads metadata insert notice in saveFile:', err?.message);
    }

    return url;
  }

  async getFileStream(filename: string): Promise<any> {
    return this.minioService.getFileStream(filename);
  }

  async deleteFile(filename: string, userId: string): Promise<void> {
    // Find upload metadata record to verify ownership
    const uploads = await this.prisma.$queryRaw<any[]>`
      SELECT id, file_path FROM public.user_uploads
      WHERE filename = ${filename} AND user_id = ${userId}::uuid
    `.catch(() => []);

    if (uploads.length === 0) {
      throw new InternalServerErrorException('File not found or access denied');
    }

    const upload = uploads[0];

    // Remove from MinIO
    await this.minioService.deleteFile(filename);

    // Remove metadata from DB
    await this.prisma.$executeRaw`
      DELETE FROM public.user_uploads
      WHERE id = ${upload.id}::uuid
    `;

    // Reset avatars if they matched this deleted file
    await this.prisma.$executeRaw`
      UPDATE public.user_profiles
      SET avatar_url = NULL
      WHERE user_id = ${userId}::uuid AND avatar_url = ${upload.file_path}
    `;

    await this.prisma.$executeRaw`
      UPDATE public.business_identities
      SET avatar_url = NULL
      WHERE owner_user_id = ${userId}::uuid AND avatar_url = ${upload.file_path}
    `;
  }
}

