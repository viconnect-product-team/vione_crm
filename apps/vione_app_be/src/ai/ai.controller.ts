import { Controller, Get, Post, Delete, Body, Param, Request, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** GET /api/ai/roles — Roles của user hiện tại (cho phân quyền AI) */
  @Get('roles')
  @UseGuards(JwtAuthGuard)
  async getRoles(@Request() req: any) {
    return this.aiService.getUserRoles(req.user.id);
  }

  /** GET /api/ai/settings/provider — Đọc cấu hình AI provider */
  @Get('settings/provider')
  async getProviderSetting() {
    return this.aiService.getAiProviderSetting();
  }

  /** GET /api/ai/overview-stats — Thống kê nhanh phục vụ AI Dashboard */
  @Get('overview-stats')
  async getOverviewStats() {
    return this.aiService.getOverviewStats();
  }

  /** POST /api/ai/chat — Endpoint AI đàm thoại & xử lý lệnh tự động hóa */
  /** POST /api/ai/chat — Endpoint AI đàm thoại & xử lý lệnh tự động hóa */
  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  async chat(@Request() req: any, @Body() body: { message: string; conversationId?: string; capability?: string; currentUser?: any }) {
    const userId = req.user?.id || body.currentUser?.id || '00000000-0000-4000-8000-000000000002';
    return this.aiService.chat(userId, body);
  }

  /** POST /api/ai/export-excel — Tạo file báo cáo Excel động từ CSDL */
  @Post('export-excel')
  @UseGuards(OptionalJwtAuthGuard)
  async exportExcel(@Body() body: { type?: string; title?: string }) {
    return this.aiService.generateExcelReport(body.type || 'finance', { title: body.title });
  }

  /** POST /api/ai/export-word — Tạo file văn bản Word (.docx) chuẩn format */
  @Post('export-word')
  @UseGuards(OptionalJwtAuthGuard)
  async exportWord(@Body() body: { type?: string; title?: string; partyA?: string; partyB?: string; value?: number; details?: string; duration?: string }) {
    return this.aiService.generateWordDocument(body.type || 'contract_b2b', body);
  }

  /** POST /api/ai/export-pdf — Tạo file tài liệu PDF (.pdf) chuẩn format */
  @Post('export-pdf')
  @UseGuards(OptionalJwtAuthGuard)
  async exportPdf(@Body() body: { type?: string; title?: string; details?: string; value?: number }) {
    return this.aiService.generatePdfDocument(body.type || 'report', body);
  }

  /** GET /api/ai/download-file/:id — Tải tệp bất kỳ (Excel, Word, PDF) */
  @Get('download-file/:id')
  async downloadFile(@Param('id') id: string, @Res() res: any) {
    const report = this.aiService.getGeneratedReport(id);
    if (!report) {
      return res.status(404).json({ ok: false, message: 'Tệp không tồn tại hoặc đã hết hạn.' });
    }
    res.setHeader('Content-Type', report.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(report.filename)}"`);
    res.setHeader('Content-Length', report.buffer.length);
    return res.end(report.buffer);
  }

  /** GET /api/ai/download-excel/:id — Tải file báo cáo Excel động (backward compatibility) */
  @Get('download-excel/:id')
  async downloadExcel(@Param('id') id: string, @Res() res: any) {
    const report = this.aiService.getGeneratedReport(id);
    if (!report) {
      return res.status(404).json({ ok: false, message: 'Báo cáo không tồn tại hoặc đã hết hạn.' });
    }
    res.setHeader('Content-Type', report.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(report.filename)}"`);
    res.setHeader('Content-Length', report.buffer.length);
    return res.end(report.buffer);
  }

  /** POST /api/ai/excel-import — Endpoint AI tự động nhập liệu Excel/CSV vào CSDL */
  @Post('excel-import')
  @UseGuards(OptionalJwtAuthGuard)
  async importExcel(@Request() req: any, @Body() body: { category?: string; rows: Record<string, any>[] }) {
    const userId = req.user?.id || '00000000-0000-4000-8000-000000000002';
    return this.aiService.importExcelData(userId, body);
  }

  /** POST /api/ai/generate-document — Endpoint AI soạn thảo văn bản & hợp đồng doanh nghiệp */
  @Post('generate-document')
  @UseGuards(OptionalJwtAuthGuard)
  async generateDocument(
    @Request() req: any,
    @Body() body: { type: string; title?: string; partyA?: string; partyB?: string; value?: number; details?: string; duration?: string },
  ) {
    const userId = req.user?.id || '00000000-0000-4000-8000-000000000002';
    return this.aiService.generateDocument(userId, body);
  }

  /** POST /api/ai/audit — Ghi audit log */
  @Post('audit')
  @UseGuards(JwtAuthGuard)
  async insertAudit(@Request() req: any, @Body() body: any) {
    await this.aiService.insertAiAudit({
      requestId: body.requestId,
      userId: req.user.id,
      associationId: body.associationId ?? null,
      capability: body.capability ?? 'unknown',
      permissionLevel: body.permissionLevel ?? 'member',
      provider: body.provider ?? 'unknown',
      model: body.model ?? null,
      usedFallback: body.usedFallback ?? false,
      fallbackReason: body.fallbackReason ?? null,
      providerLatencyMs: body.providerLatencyMs ?? 0,
      totalLatencyMs: body.totalLatencyMs ?? 0,
      sourceTypes: body.sourceTypes ?? [],
      sourceCount: body.sourceCount ?? 0,
    });

    if (body.action) {
      await this.aiService.logActivity({
        userId: req.user.id,
        action: body.action,
        target: body.target ?? '',
        category: 'ai',
      });
    }

    return { ok: true };
  }

  /** GET /api/ai/activity-log — Danh sách activity log */
  @Get('activity-log')
  async listActivityLog() {
    return this.aiService.listActivityLog();
  }

  /** DELETE /api/ai/activity-log/:id — Xóa một entry */
  @Delete('activity-log/:id')
  async deleteActivityLog(@Param('id') id: string) {
    await this.aiService.deleteActivityLog(id);
    return { ok: true };
  }

  /** POST /api/ai/activity-log/clear — Xóa toàn bộ */
  @Post('activity-log/clear')
  async clearActivityLog() {
    await this.aiService.clearActivityLog();
    return { ok: true };
  }
}
