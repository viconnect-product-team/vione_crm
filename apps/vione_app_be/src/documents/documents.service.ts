import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getActiveAssociationId(userId: string): Promise<string | null> {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT association_id
        FROM public.memberships
        WHERE user_id = ${userId}::uuid AND is_default = true
        LIMIT 1
      `;
      return rows[0]?.association_id || null;
    } catch (err) {
      console.error('Failed to get active association ID:', err);
      return null;
    }
  }

  async list(userId: string) {
    const activeId = await this.getActiveAssociationId(userId);
    
    let rows: any[];
    if (activeId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT code, name, category, size, uploaded_at, uploaded_by, type, file_path, association_id
        FROM public.documents
        WHERE association_id = ${activeId}::uuid
        ORDER BY uploaded_at DESC
      `.catch(() => []);
    } else {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT code, name, category, size, uploaded_at, uploaded_by, type, file_path, association_id
        FROM public.documents
        ORDER BY uploaded_at DESC
      `.catch(() => []);
    }

    return rows.map(r => ({
      id: r.code,
      name: r.name,
      category: r.category,
      size: r.size || '',
      uploadedAt: r.uploaded_at ? new Date(r.uploaded_at).toISOString() : new Date().toISOString(),
      uploadedBy: r.uploaded_by || '',
      type: r.type,
      filePath: r.file_path || '',
    }));
  }

  async create(userId: string, data: any) {
    const activeId = await this.getActiveAssociationId(userId);
    const code = 'DOC-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    const uploadedBy = data.uploadedBy || 'System';
    const size = data.size || '';
    const filePath = data.filePath || null;

    await this.prisma.$executeRaw`
      INSERT INTO public.documents (code, name, category, size, uploaded_by, type, file_path, association_id, uploaded_at)
      VALUES (${code}, ${data.name}, ${data.category}, ${size}, ${uploadedBy}, ${data.type}, ${filePath}, ${activeId ? activeId : null}::uuid, NOW())
    `;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT code, name, category, size, uploaded_at, uploaded_by, type, file_path
      FROM public.documents
      WHERE code = ${code}
      LIMIT 1
    `.catch(() => []);

    const r = rows[0];
    if (!r) throw new Error('Failed to retrieve created document');

    return {
      id: r.code,
      name: r.name,
      category: r.category,
      size: r.size || '',
      uploadedAt: r.uploaded_at ? new Date(r.uploaded_at).toISOString() : new Date().toISOString(),
      uploadedBy: r.uploaded_by || '',
      type: r.type,
      filePath: r.file_path || '',
    };
  }

  async update(id: string, data: any) {
    const filePath = data.filePath || null;
    await this.prisma.$executeRaw`
      UPDATE public.documents
      SET name = ${data.name},
          category = ${data.category},
          size = ${data.size || ''},
          uploaded_by = ${data.uploadedBy || 'System'},
          type = ${data.type},
          file_path = COALESCE(${filePath}, file_path)
      WHERE code = ${id}
    `;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT code, name, category, size, uploaded_at, uploaded_by, type, file_path
      FROM public.documents
      WHERE code = ${id}
      LIMIT 1
    `.catch(() => []);

    const r = rows[0];
    if (!r) throw new Error('Failed to retrieve updated document');

    return {
      id: r.code,
      name: r.name,
      category: r.category,
      size: r.size || '',
      uploadedAt: r.uploaded_at ? new Date(r.uploaded_at).toISOString() : new Date().toISOString(),
      uploadedBy: r.uploaded_by || '',
      type: r.type,
      filePath: r.file_path || '',
    };
  }

  async delete(id: string) {
    const found = await this.prisma.$queryRaw<any[]>`
      SELECT name, file_path FROM public.documents WHERE code = ${id} LIMIT 1
    `.catch(() => []);

    if (found.length === 0) {
      return { ok: false };
    }

    await this.prisma.$executeRaw`
      DELETE FROM public.documents WHERE code = ${id}
    `;

    return { ok: true };
  }

  async getUrl(id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT file_path FROM public.documents WHERE code = ${id} LIMIT 1
    `.catch(() => []);

    const filePath = rows[0]?.file_path || null;
    if (!filePath) return null;

    if (filePath.startsWith('/upload/') || filePath.startsWith('http')) {
      return filePath;
    }

    return `/upload/file/${filePath}`;
  }
}
