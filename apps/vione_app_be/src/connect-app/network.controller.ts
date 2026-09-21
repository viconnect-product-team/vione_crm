import { Controller, Get, Post, Body, Request, UseGuards, Param, Query, Delete, Patch, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller(['network', 'connect-app/network'])
@UseGuards(JwtAuthGuard)
export class NetworkController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get('connections')
  async listConnections(@Request() req) {
    return this.connectAppService.listConnections(req.user.id);
  }

  @Get('person-journey')
  async getPersonJourney(
    @Request() req,
    @Query('personId') personId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.connectAppService.getPersonJourney(req.user.id, {
      personId,
      cursor: cursor || null,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('connections/resolve')
  async resolvePublicCounterparts(@Body('userIds') userIds: string[]) {
    return this.connectAppService.resolvePublicCounterparts(userIds);
  }

  @Get('saved-cards')
  async searchSavedCards(@Request() req, @Query('term') term?: string) {
    return this.connectAppService.searchSavedCards(req.user.id, term || '');
  }

  @Get('guest-contacts')
  async listGuestContacts(@Request() req) {
    return this.connectAppService.listGuestContacts(req.user.id);
  }

  @Get('guest-contacts/:id')
  async getGuestContact(@Request() req, @Param('id') id: string) {
    return this.connectAppService.getGuestContact(req.user.id, id);
  }

  @Patch('guest-contacts/:id/owner-fields')
  async updateGuestContactOwnerFields(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { ownerLabel?: string | null; ownerNote?: string | null },
  ) {
    return this.connectAppService.updateGuestContactOwnerFields(req.user.id, id, body);
  }

  @Delete('guest-contacts/:id')
  async deleteGuestContact(@Request() req, @Param('id') id: string) {
    return this.connectAppService.deleteGuestContact(req.user.id, id);
  }

  @Get('recommendations/today')
  async getTodayRecommendations(@Request() req) {
    return this.connectAppService.getTodayRecommendations(req.user.id);
  }

  @Get('recommendations/person/:personId')
  async getPersonRecommendation(@Request() req, @Param('personId') personId: string) {
    return this.connectAppService.getPersonRecommendation(req.user.id, personId);
  }

  @Delete('recommendations/person/:personId')
  async dismissRecommendation(@Request() req, @Param('personId') personId: string) {
    return this.connectAppService.dismissRecommendation(req.user.id, personId);
  }

  @Get('feed')
  async getNetworkFeed(@Request() req, @Query('cursor') cursor?: string) {
    return this.connectAppService.getNetworkFeed(req.user.id, cursor || null);
  }

  @Post('requests')
  async sendConnectionRequest(@Request() req, @Body() body: any) {
    return this.connectAppService.sendConnectionRequest(req.user.id, body);
  }

  @Patch('connections/:id')
  async updateConnection(@Request() req, @Param('id') id: string, @Body() body: { status: string }) {
    if (body.status === 'accepted') {
      return this.connectAppService.acceptConnection(req.user.id, { connectionId: id });
    } else if (body.status === 'declined') {
      return this.connectAppService.declineConnection(req.user.id, { connectionId: id });
    }
    throw new BadRequestException('invalid_status');
  }

  @Delete('connections/:id')
  async deleteConnection(@Request() req, @Param('id') id: string) {
    return this.connectAppService.disconnectConnection(req.user.id, { connectionId: id });
  }

  @Post('blocks')
  async blockUser(@Request() req, @Body() body: any) {
    return this.connectAppService.blockUser(req.user.id, body);
  }

  @Get('state')
  async getConnectionState(@Request() req, @Query('targetUserId') targetUserId: string) {
    return this.connectAppService.getConnectionState(req.user.id, targetUserId);
  }

  @Get('token-state/:token')
  async getConnectionStateByToken(@Request() req, @Param('token') token: string) {
    return this.connectAppService.getConnectionStateByToken(req.user.id, token);
  }

  @Post('connections/token')
  async sendConnectionRequestByToken(@Request() req, @Body('token') token: string, @Body('mutationKey') mutationKey?: string) {
    return this.connectAppService.sendConnectionRequestByToken(req.user.id, token, mutationKey);
  }

  /**
   * NFC Tap-to-Exchange — single-shot endpoint.
   * Resolves the share token, fetches the target profile (visibility-filtered),
   * creates or finds an existing connection, and returns both profile + state.
   * Frontend calls this immediately after reading an NFC tag — no extra steps.
   */
  @Post('nfc-tap')
  async nfcTap(@Request() req, @Body() body: any) {
    return this.connectAppService.nfcTap(req.user.id, body);
  }


  @Get('connection/:connectionId')
  async getConnectionById(@Request() req, @Param('connectionId') connectionId: string) {
    return this.connectAppService.getConnectionById(req.user.id, connectionId);
  }

  @Get('requests/incoming')
  async listIncomingRequests(@Request() req) {
    return this.connectAppService.listIncomingRequests(req.user.id);
  }

  @Get('requests/outgoing')
  async listOutgoingRequests(@Request() req) {
    return this.connectAppService.listOutgoingRequests(req.user.id);
  }

  @Get('connections/status-counts')
  async countConnectionsByStatus(@Request() req) {
    return this.connectAppService.countConnectionsByStatus(req.user.id);
  }

  @Post('abuse/reports')
  async reportUser(@Request() req, @Body() data: any) {
    return this.connectAppService.reportUser(req.user.id, data);
  }

  // --- Person Plan ---
  @Post('person-plans')
  async createPersonPlan(@Request() req, @Body() data: any) {
    return this.connectAppService.createPersonPlan(req.user.id, data);
  }

  @Get('person-plans')
  async listPersonPlans(
    @Request() req,
    @Query('personId') personId?: string,
    @Query('includeClosed') includeClosed?: string,
    @Query('limit') limit?: string,
  ) {
    return this.connectAppService.listPersonPlans(req.user.id, {
      personId: personId || null,
      includeClosed: includeClosed === 'true',
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch('person-plans/:planId/status')
  async setPersonPlanStatus(@Request() req, @Param('planId') planId: string, @Body() body: { status: string }) {
    return this.connectAppService.setPersonPlanStatus(req.user.id, { planId, status: body.status });
  }

  // --- BC-Mobile-6C: Personalization & Recommendations Settings ---
  @Get('personalization/get')
  async getPersonalization(@Request() req) {
    return this.connectAppService.getPersonalization(req.user.id);
  }

  @Post('personalization/update')
  async updatePersonalization(@Request() req, @Body() body: any) {
    return this.connectAppService.updatePersonalizationPreferences(req.user.id, body);
  }

  @Post('personalization/record-interaction')
  async recordPersonalizationInteraction(@Request() req, @Body() body: any) {
    return this.connectAppService.recordPersonalizationInteraction(req.user.id, body);
  }

  @Post('personalization/reset')
  async resetPersonalization(@Request() req) {
    return this.connectAppService.resetPersonalization(req.user.id);
  }
}

