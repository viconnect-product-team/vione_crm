import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller('opportunities')
@UseGuards(JwtAuthGuard)
export class OpportunityController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get()
  async listAll(@Request() req: any) {
    return this.connectAppService.listAllOpportunities(req.user.id);
  }

  @Get('my-opportunities')
  async listMyOpportunities(@Request() req: any) {
    return this.connectAppService.listMyOpportunities(req.user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.connectAppService.getOpportunityById(id);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.connectAppService.createOpportunity(req.user.id, body);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.connectAppService.deleteOpportunity(req.user.id, id);
  }

  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.connectAppService.updateOpportunity(req.user.id, id, body);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Request() req: any, @Param('id') id: string) {
    return this.connectAppService.toggleOpportunityStatus(req.user.id, id);
  }

  @Post(':id/claim')
  async claim(@Request() req: any, @Param('id') id: string) {
    return this.connectAppService.claimCommunityOpportunity(req.user.id, '', id);
  }

  @Post(':id/interests')
  async expressInterestById(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { interestLevel?: 'high' | 'low'; message?: string },
  ) {
    return this.connectAppService.expressCommunityOpportunityInterest(
      req.user.id,
      '',
      id,
      body?.interestLevel || 'high',
    );
  }

  @Post('express-interest')
  async expressInterest(@Request() req: any, @Body() body: { opportunityId: string; message?: string }) {
    return this.connectAppService.expressOpportunityInterest(req.user.id, body.opportunityId, body.message);
  }

  @Post(':id/view')
  async incrementView(@Param('id') id: string) {
    return this.connectAppService.incrementOpportunityView(id);
  }

  @Get(':id/interests')
  async getOpportunityInterests(@Param('id') id: string) {
    const list = await this.connectAppService.getOpportunityInterestedMembers(id);
    return { ok: true, interests: list };
  }
}
