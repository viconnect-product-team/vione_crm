import { Controller, Get, Post, Body, Request, UseGuards, Param, Query, Delete, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

export class CreateCommunityDto {
  name!: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  coverUrl?: string;
  slug?: string;
  tagline?: string;
  about?: string;
}

function cleanCommunityId(communityId: string): string {
  if (!communityId) return 'c1983000-0000-4000-8000-000000001983';
  let id = String(communityId).trim();
  try {
    id = decodeURIComponent(id);
  } catch {}
  if (/^[0-9a-fA-F-]{36}$/.test(id)) {
    return id;
  }
  const match = id.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (match) {
    return match[0];
  }
  return 'c1983000-0000-4000-8000-000000001983';
}

@Controller(['communities', 'connect-app/community'])
@UseGuards(OptionalJwtAuthGuard)
export class CommunityController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyCommunities(@Request() req) {
    return this.connectAppService.getMyCommunities(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCommunity(
    @Request() req,
    @Body() body: CreateCommunityDto,
  ) {
    return this.connectAppService.createCommunity(req.user.id, body);
  }

  // --- Static Community Join Requests & Invites (must be defined before :communityId) ---
  @Get('all')
  async listAllCommunities() {
    return this.connectAppService.listAllCommunities();
  }

  @Get('joinable')
  async listJoinableCommunities(@Request() req) {
    return this.connectAppService.listJoinableCommunities(req.user.id);
  }

  @Get('join-requests/history')
  async listCommunityJoinHistory(@Request() req) {
    return this.connectAppService.listCommunityJoinHistory(req.user.id);
  }

  @Post('join-requests/sync')
  @UseGuards(JwtAuthGuard)
  async syncCommunityJoinDecisions(@Request() req) {
    return this.connectAppService.syncCommunityJoinDecisions(req.user.id);
  }

  @Get('join-requests/admin')
  async listCommunityJoinAdminRequests(@Request() req) {
    return this.connectAppService.listCommunityJoinAdminRequests(req.user.id);
  }

  @Delete('invites/:inviteRef')
  @UseGuards(JwtAuthGuard)
  async cancelCommunityInvite(@Request() req, @Param('inviteRef') inviteRef: string) {
    return this.connectAppService.cancelCommunityInvite(req.user.id, inviteRef);
  }

  @Post('invites/:inviteRef/resend')
  @UseGuards(JwtAuthGuard)
  async resendCommunityInvite(
    @Request() req,
    @Param('inviteRef') inviteRef: string,
    @Body('locale') locale?: string,
  ) {
    return this.connectAppService.resendCommunityInvite(req.user.id, inviteRef, locale);
  }

  @Get('invites/token/:token')
  async getCommunityInviteByToken(@Request() req, @Param('token') token: string) {
    return this.connectAppService.getCommunityInviteByToken(req.user.id, token);
  }

  @Post('invites/accept')
  @UseGuards(JwtAuthGuard)
  async acceptCommunityInvite(@Request() req, @Body() body: { token: string; email: string }) {
    return this.connectAppService.acceptCommunityInvite(req.user.id, body.token, body.email);
  }

  @Patch('invites/:inviteRef/role')
  @UseGuards(JwtAuthGuard)
  async updateAcceptedInviteRole(
    @Request() req,
    @Param('inviteRef') inviteRef: string,
    @Body('role') role: 'admin' | 'member',
  ) {
    return this.connectAppService.updateAcceptedInviteRole(req.user.id, inviteRef, role);
  }

  @Get('invites/:inviteRef/role-history')
  async listInviteRoleHistory(@Request() req, @Param('inviteRef') inviteRef: string) {
    return this.connectAppService.listInviteRoleHistory(req.user.id, inviteRef);
  }

  // --- Parameterized :communityId Routes ---
  @Get(':communityId')
  async getCommunityDetail(@Request() req, @Param('communityId') communityId: string) {
    return this.connectAppService.getCommunityDetail(req.user.id, cleanCommunityId(communityId));
  }

  @Patch(':communityId')
  @UseGuards(JwtAuthGuard)
  async updateCommunity(
    @Param('communityId') communityId: string,
    @Body() body: any,
  ) {
    return this.connectAppService.updateCommunity(cleanCommunityId(communityId), body);
  }

  @Delete(':communityId')
  @UseGuards(JwtAuthGuard)
  async deleteCommunity(
    @Param('communityId') communityId: string,
  ) {
    return this.connectAppService.deleteCommunity(cleanCommunityId(communityId));
  }

  @Get(':communityId/activity-preview')
  async getCommunityActivityPreview(@Request() req, @Param('communityId') communityId: string) {
    return this.connectAppService.getCommunityActivityPreview(req.user.id, cleanCommunityId(communityId));
  }

  @Get(':communityId/members')
  async listCommunityMembers(
    @Request() req,
    @Param('communityId') communityId: string,
    @Query('query') query?: string,
    @Query('offset') offset?: string,
    @Query('roleFilter') roleFilter?: string,
  ) {
    return this.connectAppService.listCommunityMembers(
      req.user.id,
      cleanCommunityId(communityId),
      query || '',
      offset ? parseInt(offset, 10) : 0,
      roleFilter || 'all',
    );
  }

  @Get(':communityId/members/:memberRef')
  async getCommunityMemberProfile(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('memberRef') memberRef: string,
  ) {
    return this.connectAppService.getCommunityMemberProfile(req.user.id, cleanCommunityId(communityId), memberRef);
  }

  @Post(':communityId/members/:memberRef/connect')
  @UseGuards(JwtAuthGuard)
  async connectCommunityMember(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('memberRef') memberRef: string,
  ) {
    return this.connectAppService.connectCommunityMember(req.user.id, cleanCommunityId(communityId), memberRef);
  }

  @Patch(':communityId/members/:memberRef/role')
  @UseGuards(JwtAuthGuard)
  async updateCommunityMemberRole(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('memberRef') memberRef: string,
    @Body('role') role: string,
  ) {
    return this.connectAppService.updateCommunityMemberRole(req.user.id, cleanCommunityId(communityId), memberRef, role);
  }

  // --- Community News ---
  @Get(':communityId/news')
  async listCommunityNews(
    @Request() req,
    @Param('communityId') communityId: string,
    @Query('offset') offset?: string,
  ) {
    return this.connectAppService.listCommunityNews(
      req.user.id,
      cleanCommunityId(communityId),
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':communityId/news/:newsRef')
  async getCommunityNewsDetail(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('newsRef') newsRef: string,
  ) {
    return this.connectAppService.getCommunityNewsDetail(req.user.id, cleanCommunityId(communityId), newsRef);
  }

  @Post(':communityId/join-requests')
  @UseGuards(JwtAuthGuard)
  async requestCommunityJoin(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() body: { note?: string | null },
  ) {
    return this.connectAppService.requestCommunityJoin(req.user.id, { communityId: cleanCommunityId(communityId), note: body.note });
  }

  @Delete(':communityId/join-requests')
  @UseGuards(JwtAuthGuard)
  async cancelCommunityJoin(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() body: { cancelReason?: string | null },
  ) {
    return this.connectAppService.cancelCommunityJoin(req.user.id, { communityId: cleanCommunityId(communityId), cancelReason: body.cancelReason });
  }

  // --- Community Invites (:communityId) ---
  @Get(':communityId/invites')
  @UseGuards(JwtAuthGuard)
  async listCommunityInvites(@Request() req, @Param('communityId') communityId: string) {
    return this.connectAppService.listCommunityInvites(req.user.id, cleanCommunityId(communityId));
  }

  @Post(':communityId/invites')
  @UseGuards(JwtAuthGuard)
  async createCommunityInvite(@Request() req, @Param('communityId') communityId: string, @Body() body: any) {
    return this.connectAppService.createCommunityInvite(req.user.id, { ...body, communityId: cleanCommunityId(communityId) });
  }

  @Get(':communityId/invite-templates')
  async listCommunityInviteTemplates(@Request() req, @Param('communityId') communityId: string) {
    return this.connectAppService.listCommunityInviteTemplates(req.user.id, cleanCommunityId(communityId));
  }

  @Post(':communityId/invite-templates')
  async saveCommunityInviteTemplate(@Request() req, @Param('communityId') communityId: string, @Body() body: any) {
    return this.connectAppService.saveCommunityInviteTemplate(req.user.id, { ...body, communityId: cleanCommunityId(communityId) });
  }

  @Post(':communityId/invite-templates/reset')
  async resetCommunityInviteTemplate(@Request() req, @Param('communityId') communityId: string, @Body() body: any) {
    return this.connectAppService.resetCommunityInviteTemplate(req.user.id, { ...body, communityId: cleanCommunityId(communityId) });
  }

  // --- Community Activity ---
  @Get(':communityId/events')
  async listCommunityEvents(
    @Request() req,
    @Param('communityId') communityId: string,
    @Query('tab') tab: 'upcoming' | 'registered',
    @Query('offset') offset?: string,
  ) {
    return this.connectAppService.listCommunityEvents(
      req.user.id,
      cleanCommunityId(communityId),
      tab,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':communityId/events/:eventRef')
  async getCommunityEventDetail(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('eventRef') eventRef: string,
  ) {
    return this.connectAppService.getCommunityEventDetail(req.user.id, cleanCommunityId(communityId), eventRef);
  }

  @Post(':communityId/events/:eventRef/registrations')
  @UseGuards(JwtAuthGuard)
  async registerCommunityEvent(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('eventRef') eventRef: string,
  ) {
    return this.connectAppService.registerCommunityEvent(req.user.id, cleanCommunityId(communityId), eventRef);
  }

  @Delete(':communityId/events/:eventRef/registrations')
  @UseGuards(JwtAuthGuard)
  async cancelCommunityEventRegistration(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('eventRef') eventRef: string,
  ) {
    return this.connectAppService.cancelCommunityEventRegistration(req.user.id, cleanCommunityId(communityId), eventRef);
  }

  @Get(':communityId/opportunities')
  async listCommunityOpportunities(
    @Request() req,
    @Param('communityId') communityId: string,
    @Query('query') query?: string,
    @Query('offset') offset?: string,
  ) {
    return this.connectAppService.listCommunityOpportunities(
      req.user.id,
      cleanCommunityId(communityId),
      query || '',
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':communityId/opportunities/:opportunityRef')
  async getCommunityOpportunityDetail(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
  ) {
    return this.connectAppService.getCommunityOpportunityDetail(req.user.id, cleanCommunityId(communityId), opportunityRef);
  }

  @Post(':communityId/opportunities')
  @UseGuards(JwtAuthGuard)
  async createCommunityOpportunity(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() body: any,
  ) {
    return this.connectAppService.createCommunityOpportunity(req.user.id, cleanCommunityId(communityId), body);
  }

  @Post(':communityId/news')
  @UseGuards(JwtAuthGuard)
  async createCommunityNews(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() body: any,
  ) {
    return this.connectAppService.createCommunityNews(req.user.id, cleanCommunityId(communityId), body);
  }

  @Post(':communityId/opportunities/:opportunityRef/claim')
  @UseGuards(JwtAuthGuard)
  async claimCommunityOpportunity(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
  ) {
    return this.connectAppService.claimCommunityOpportunity(req.user.id, cleanCommunityId(communityId), opportunityRef);
  }

  @Post(':communityId/opportunities/:opportunityRef/interests')
  @UseGuards(JwtAuthGuard)
  async expressCommunityOpportunityInterest(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
    @Body('interestLevel') interestLevel?: 'high' | 'low',
  ) {
    return this.connectAppService.expressCommunityOpportunityInterest(
      req.user.id,
      cleanCommunityId(communityId),
      opportunityRef,
      interestLevel,
    );
  }

  @Delete(':communityId/opportunities/:opportunityRef/interests')
  @UseGuards(JwtAuthGuard)
  async withdrawCommunityOpportunityInterest(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
  ) {
    return this.connectAppService.withdrawCommunityOpportunityInterest(req.user.id, cleanCommunityId(communityId), opportunityRef);
  }

  @Post(':communityId/opportunities/:opportunityRef/followups')
  @UseGuards(JwtAuthGuard)
  async scheduleCommunityOpportunityFollowUp(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
    @Body('inDays') inDays: number,
  ) {
    return this.connectAppService.scheduleCommunityOpportunityFollowUp(
      req.user.id,
      cleanCommunityId(communityId),
      opportunityRef,
      inDays,
    );
  }

  @Patch(':communityId/opportunities/:opportunityRef/followups')
  @UseGuards(JwtAuthGuard)
  async updateCommunityOpportunityFollowUp(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
    @Body('action') action: 'done' | 'cancel',
  ) {
    return this.connectAppService.updateCommunityOpportunityFollowUp(
      req.user.id,
      cleanCommunityId(communityId),
      opportunityRef,
      action,
    );
  }

  @Post(':communityId/opportunities/:opportunityRef/progress')
  @UseGuards(JwtAuthGuard)
  async saveCommunityOpportunityProgress(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
    @Body('progress') progress: string,
    @Body('note') note?: string,
  ) {
    return this.connectAppService.saveCommunityOpportunityProgress(
      req.user.id,
      cleanCommunityId(communityId),
      opportunityRef,
      progress,
      note || '',
    );
  }

  @Post(':communityId/opportunities/:opportunityRef/attachments')
  @UseGuards(JwtAuthGuard)
  async addCommunityOpportunityAttachment(
    @Request() req,
    @Param('communityId') communityId: string,
    @Param('opportunityRef') opportunityRef: string,
    @Body() body: any,
  ) {
    return this.connectAppService.addCommunityOpportunityAttachment(req.user.id, {
      ...body,
      communityId: cleanCommunityId(communityId),
      opportunityRef,
    });
  }

  @Delete('opportunities/attachments/:attachmentId')
  @UseGuards(JwtAuthGuard)
  async removeCommunityOpportunityAttachment(@Request() req, @Param('attachmentId') attachmentId: string) {
    return this.connectAppService.removeCommunityOpportunityAttachment(req.user.id, attachmentId);
  }
}
