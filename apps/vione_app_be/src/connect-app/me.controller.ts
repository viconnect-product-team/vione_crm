import { Controller, Get, Post, Put, Patch, Delete, Body, Request, UseGuards, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller(['me', 'connect-app/me'])
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get('profile')
  async getMyProfile(@Request() req) {
    return this.connectAppService.getMyProfile(req.user.id);
  }

  @Put('profile')
  async updateMyProfile(@Request() req, @Body() data: any) {
    return this.connectAppService.updateMyProfile(req.user.id, data);
  }

  @Get('identity')
  async getMyIdentity(@Request() req) {
    return this.connectAppService.getMyIdentity(req.user.id);
  }

  @Put('identity')
  async upsertMyIdentity(@Request() req, @Body() data: any) {
    return this.connectAppService.upsertMyIdentity(req.user.id, data);
  }

  @Patch('identity/visibility')
  async updateMyVisibility(@Request() req, @Body() updates: any[]) {
    return this.connectAppService.updateMyVisibility(req.user.id, updates);
  }

  @Post('identity/share-link')
  async getOrCreateMyShareLink(@Request() req) {
    return this.connectAppService.getOrCreateMyShareLink(req.user.id);
  }

  @Post('identity/share-link/rotate')
  async rotateMyShareLink(@Request() req) {
    return this.connectAppService.rotateMyShareLink(req.user.id);
  }

  @Get('briefing')
  async getBriefing(@Request() req) {
    return this.connectAppService.getBriefing(req.user.id);
  }

  @Get('notifications')
  async listNotifications(@Request() req, @Query('limit') limit?: string, @Query('unreadOnly') unreadOnly?: string) {
    const lim = limit ? parseInt(limit, 10) : 30;
    const isUnreadOnly = unreadOnly === 'true' || unreadOnly === '1';
    return this.connectAppService.listNotifications(req.user.id, lim, isUnreadOnly);
  }

  @Get('notifications/member')
  async listMyMemberNotifications(@Request() req) {
    return this.connectAppService.listMyMemberNotifications(req.user.id);
  }

  @Post('notifications/member/read')
  async markMemberNotificationRead(@Request() req, @Body('id') id: string) {
    return this.connectAppService.markMemberNotificationRead(req.user.id, id);
  }

  @Post('notifications/member/read-all')
  async markAllMemberNotificationsRead(@Request() req) {
    return this.connectAppService.markAllMemberNotificationsRead(req.user.id);
  }

  @Post('notifications/member/dismiss')
  async dismissMemberNotification(@Request() req, @Body('id') id: string) {
    return this.connectAppService.dismissMemberNotification(req.user.id, id);
  }

  @Post('notifications/member/delete')
  async deleteMemberNotification(@Request() req, @Body('id') id: string) {
    return this.connectAppService.deleteMemberNotification(req.user.id, id);
  }

  @Post('notifications/member/dismiss-broadcast')
  async dismissBroadcastNotification(@Request() req, @Body('ids') ids: string[]) {
    return this.connectAppService.dismissBroadcastNotification(req.user.id, ids || []);
  }

  @Get('notifications/unread-count')
  async getUnreadNotificationCount(@Request() req) {
    return this.connectAppService.getUnreadNotificationCount(req.user.id);
  }

  @Patch('notifications/read')
  async markNotificationsRead(@Request() req, @Body('ids') ids?: string[]) {
    return this.connectAppService.markNotificationsRead(req.user.id, ids);
  }

  @Post('notifications/read')
  async markNotificationsReadPost(@Request() req, @Body('ids') ids?: string[]) {
    return this.connectAppService.markNotificationsRead(req.user.id, ids);
  }

  @Delete('notifications/:id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    return this.connectAppService.deleteNotification(req.user.id, id);
  }

  @Post('notifications/delete')
  async deleteNotificationsPost(@Request() req, @Body('ids') ids: string[]) {
    return this.connectAppService.deleteNotifications(req.user.id, ids);
  }

  @Get('notifications/prefs')
  async getNotificationPrefs(@Request() req) {
    return this.connectAppService.getNotificationPrefs(req.user.id);
  }

  @Put('notifications/prefs')
  async setNotificationPrefs(@Request() req, @Body() prefs: any) {
    return this.connectAppService.setNotificationPrefs(req.user.id, prefs);
  }

  @Get('showcase')
  async getMyShowcase(@Request() req) {
    return this.connectAppService.getMyShowcase(req.user.id);
  }

  @Post('showcase')
  async addShowcaseItem(@Request() req, @Body() data: any) {
    return this.connectAppService.addShowcaseItem(req.user.id, data);
  }

  @Delete('showcase/:id')
  async deleteShowcaseItem(@Request() req, @Param('id') id: string) {
    return this.connectAppService.deleteShowcaseItem(req.user.id, id);
  }

  // --- Settings ---
  @Get('settings')
  async getSettings(@Request() req) {
    return this.connectAppService.getSettings(req.user.id);
  }

  @Post('settings')
  async saveSettings(@Request() req, @Body() body: any) {
    return this.connectAppService.saveSettings(req.user.id, body);
  }

  // --- Voting preference ---
  @Get('voting-pref')
  async getVotingPref(@Request() req) {
    return this.connectAppService.getVotingPref(req.user.id);
  }

  @Post('voting-pref')
  async setVotingPref(@Request() req, @Body('pref') pref: string | null) {
    return this.connectAppService.setVotingPref(req.user.id, pref ?? null);
  }

  // --- Post-login route resolution ---
  @Get('post-login-route')
  async getPostLoginRoute(@Request() req) {
    return this.connectAppService.getPostLoginRoute(req.user.id);
  }

  // --- Media signed URL (product-media bucket) ---
  @Post('media/signed-url')
  async getMediaSignedUrl(@Request() req, @Body('path') path: string) {
    return this.connectAppService.getMediaSignedUrl(req.user.id, path);
  }
}
