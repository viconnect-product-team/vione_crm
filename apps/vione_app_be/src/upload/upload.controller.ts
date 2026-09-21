/* eslint-disable */
import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Res,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { UploadService } from './upload.service';
import * as path from 'path';

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.json': 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(AuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not identified in auth session');
    }

    try {
      const url = await this.uploadService.saveAvatar(file, userId);
      return { url };
    } catch (err: any) {
      console.error('uploadAvatar error:', err);
      throw new BadRequestException(err?.message || 'Failed to process avatar upload');
    }
  }

  @UseGuards(AuthGuard)
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not identified in auth session');
    }

    try {
      const url = await this.uploadService.saveFile(file, userId);
      return { url };
    } catch (err: any) {
      console.error('uploadFile error:', err);
      throw new BadRequestException(err?.message || 'Failed to process file upload');
    }
  }

  @Get('file/:folder/:file')
  async getFileWithFolder(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() res: any,
  ) {
    return this.serveFile(`${folder}/${file}`, res);
  }

  @Get('file/:file')
  async getFileSingle(
    @Param('file') file: string,
    @Res() res: any,
  ) {
    return this.serveFile(file, res);
  }

  @Get('file/*')
  async getFile(
    @Request() req: any,
    @Res() res: any,
  ) {
    let filePathStr = req.params?.[0] || req.params?.['0'] || req.params?.path;
    if (!filePathStr && req.url) {
      filePathStr = req.url.replace(/^.*\/file\//, '').split('?')[0];
    }
    return this.serveFile(filePathStr, res);
  }

  private async serveFile(rawPath: any, res: any) {
    let filePathStr = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath || '');
    if (!filePathStr) {
      return res.status(404).send('Filename is missing');
    }
    try {
      filePathStr = decodeURIComponent(filePathStr);
    } catch {}
    filePathStr = filePathStr.replace(/^\/+/, '');

    const contentType = getContentType(filePathStr);

    const pipeSafe = (readable: any) => {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      readable.on('error', () => {
        if (!res.headersSent) {
          res.status(404).send('File not found');
        } else {
          res.end();
        }
      });
      return readable.pipe(res);
    };

    try {
      // 1. Thử tìm tệp trên ổ đĩa cục bộ (disk fallback)
      const fs = await import('fs');
      const filenameOnly = path.basename(filePathStr);
      const candidates = [
        path.join('/app', 'uploads', filePathStr),
        path.join('/app', 'uploads', 'avatars', filenameOnly),
        path.join('/app', 'uploads', 'documents', filenameOnly),
        path.join(process.cwd(), 'uploads', filePathStr),
        path.join(process.cwd(), 'uploads', 'avatars', filenameOnly),
        path.join(process.cwd(), 'uploads', 'documents', filenameOnly),
        path.join('/tmp', 'uploads', filePathStr),
        path.join('/tmp', 'uploads', 'avatars', filenameOnly),
        path.join('/tmp', 'uploads', 'documents', filenameOnly),
        path.join(process.cwd(), 'dist', 'uploads', filePathStr),
        path.join(process.cwd(), 'dist', 'uploads', 'avatars', filenameOnly),
        path.join(process.cwd(), filePathStr),
      ];

      for (const cand of candidates) {
        try {
          if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
            return pipeSafe(fs.createReadStream(cand));
          }
        } catch {}
      }

      // 2. Thử tìm trên MinIO theo các đường dẫn tiềm năng
      const minioKeys = [
        filePathStr,
        filenameOnly,
        `avatars/${filenameOnly}`,
        `documents/${filenameOnly}`,
      ];
      if (!filePathStr.startsWith('avatars/')) {
        minioKeys.push(`avatars/${filePathStr}`);
      } else {
        minioKeys.push(filePathStr.replace(/^avatars\//, ''));
      }
      if (!filePathStr.startsWith('documents/')) {
        minioKeys.push(`documents/${filePathStr}`);
      }

      for (const key of minioKeys) {
        try {
          const stream = await this.uploadService.getFileStream(key);
          if (stream) {
            return pipeSafe(stream);
          }
        } catch {}
      }

      // Fallback an toàn: Nếu là tệp hình ảnh, thay vì trả 404 làm vỡ giao diện web và báo lỗi đỏ console,
      // trả về SVG dự phòng chuẩn thương hiệu CEO 1983 với mã 200 OK
      if (contentType.startsWith('image/')) {
        const isAvatar = filePathStr.includes('avatar');
        const fallbackSvg = isAvatar
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="av" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#003B95"/><stop offset="100%" stop-color="#0A1A3A"/></linearGradient></defs><rect width="200" height="200" rx="36" fill="url(#av)"/><circle cx="100" cy="75" r="38" fill="#F59E0B" opacity="0.9"/><path d="M40 170 C40 125, 70 115, 100 115 C130 115, 160 125, 160 170 Z" fill="#F59E0B" opacity="0.9"/><text x="100" y="190" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="700">CEO 1983</text></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#071228"/><stop offset="50%" stop-color="#003B95"/><stop offset="100%" stop-color="#0A1A3A"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="#F59E0B" font-family="sans-serif" font-size="24" font-weight="800" letter-spacing="3">CLB DOANH NHÂN CEO 1983</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#E2E8F0" font-family="sans-serif" font-size="13" font-weight="500" letter-spacing="1">HỆ SINH THÁI SỐ &amp; KẾT NỐI GIAO THƯƠNG B2B</text></svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(fallbackSvg);
      }

      return res.status(404).send('File not found');
    } catch (err) {
      if (!res.headersSent) {
        if (contentType.startsWith('image/')) {
          const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="100%" height="100%" fill="#0A1A3A"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F59E0B" font-family="sans-serif" font-size="16" font-weight="bold">CEO 1983</text></svg>`;
          res.setHeader('Content-Type', 'image/svg+xml');
          return res.status(200).send(fallbackSvg);
        }
        return res.status(404).send('File not found');
      } else {
        res.end();
      }
    }
  }

  @UseGuards(AuthGuard)
  @Delete('file/:folder/:file')
  async deleteFileFolder(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    await this.uploadService.deleteFile(`${folder}/${file}`, userId);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Delete('file/*')
  async deleteFile(
    @Request() req: any,
  ) {
    let filePathStr = req.params?.[0] || req.params?.['0'] || req.params?.path;
    if (!filePathStr && req.url) {
      filePathStr = req.url.replace(/^.*\/file\//, '').split('?')[0];
    }
    if (!filePathStr) {
      throw new BadRequestException('Filename is missing');
    }

    const userId = req.user?.id || req.user?.sub;
    await this.uploadService.deleteFile(filePathStr, userId);
    return { success: true };
  }
}

