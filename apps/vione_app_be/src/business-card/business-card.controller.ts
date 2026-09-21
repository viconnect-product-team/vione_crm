import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { BusinessCardService } from './business-card.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('business-cards')
export class BusinessCardController {
  constructor(private readonly businessCardService: BusinessCardService) {}

  @Get('public/:slug')
  getPublicCard(@Param('slug') slug: string) {
    return this.businessCardService.getPublicBySlug(slug);
  }

  @Get('public-card/:code')
  getPublicCardByCode(@Param('code') code: string) {
    return this.businessCardService.getPublicCardByCode(code);
  }

  @UseGuards(AuthGuard)
  @Get('settings/me')
  getCardSettings(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.getCardSettings(userId);
  }

  @UseGuards(AuthGuard)
  @Post('settings/me')
  saveCardSettings(@Request() req: any, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.saveCardSettings(userId, data);
  }

  @UseGuards(AuthGuard)
  @Post('ai-history')
  saveCardAiHistory(@Request() req: any, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.saveCardAiHistory(userId, data);
  }

  @UseGuards(AuthGuard)
  @Get('ai-history')
  listCardAiHistory(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.listCardAiHistory(userId);
  }

  @UseGuards(AuthGuard)
  @Delete('ai-history/:id')
  deleteCardAiHistory(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.deleteCardAiHistory(userId, id);
  }

  @UseGuards(AuthGuard)
  @Get('admin/level')
  getBcAdminLevel(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.getBcAdminLevel(userId);
  }

  @UseGuards(AuthGuard)
  @Get('admin/all')
  listAllAdminCards(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.listAllAdminCards(userId);
  }

  @UseGuards(AuthGuard)
  @Post('admin/status')
  adminSetCardStatus(
    @Request() req: any,
    @Body('id') id: string,
    @Body('status') status: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.adminSetCardStatus(userId, id, status);
  }

  @UseGuards(AuthGuard)
  @Post('admin/bulk-status')
  adminSetCardsStatus(
    @Request() req: any,
    @Body('ids') ids: string[],
    @Body('status') status: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.adminSetCardsStatus(userId, ids, status);
  }

  @UseGuards(AuthGuard)
  @Get()
  listMyCards(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.listMyCards(userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  getMyCard(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.getMyCard(userId, id);
  }

  @UseGuards(AuthGuard)
  @Post()
  saveCard(@Request() req: any, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.saveCard(userId, data);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/status')
  setStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.setStatus(userId, id, status);
  }

  @UseGuards(AuthGuard)
  @Get('preview/:slug')
  getPreviewBySlug(@Param('slug') slug: string) {
    return this.businessCardService.getPreviewBySlug(slug);
  }

  @Get('public-slugs')
  listPublicProfileSlugs() {
    return this.businessCardService.listPublicProfileSlugs();
  }

  @UseGuards(AuthGuard)
  @Post(':id/primary')
  setPrimary(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.setPrimary(userId, id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteCard(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.deleteCard(userId, id);
  }

  // --- Leads ---

  @UseGuards(AuthGuard)
  @Get('leads/me')
  listMyLeads(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.listMyLeads(userId);
  }

  @UseGuards(AuthGuard)
  @Patch('leads/:id/status')
  updateLeadStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.updateLeadStatus(
      userId,
      id,
      body.status,
      body.note,
    );
  }

  @UseGuards(AuthGuard)
  @Post('leads/:id/reply')
  sendLeadReply(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.sendLeadReply(userId, id, body);
  }

  @UseGuards(AuthGuard)
  @Post('leads/:id/workflow')
  processLeadWorkflow(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.processLeadWorkflow(
      userId,
      id,
      body.status,
      body.note,
    );
  }

  @UseGuards(AuthGuard)
  @Get('leads/stats')
  getLeadStats(@Request() req: any) {
    // Assuming days is passed as a query param
    const days = req.query.days ? parseInt(req.query.days, 10) : 30;
    const userId = req.user.id || req.user.sub;
    return this.businessCardService.getLeadStats(userId, days);
  }
}
