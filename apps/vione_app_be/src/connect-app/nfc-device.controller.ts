import { Controller, Get, Post, Patch, Delete, Body, Request, UseGuards, Headers, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller(['me', 'connect-app/me'])
@UseGuards(JwtAuthGuard)
export class NfcDeviceController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  // --- NFC Tags ---
  @Get('nfc-tags')
  async listMyNfcTags(@Request() req) {
    return this.connectAppService.listMyNfcTags(req.user.id);
  }

  @Post('nfc-tags')
  async registerMyNfcTag(@Request() req, @Body() data: any) {
    return this.connectAppService.registerMyNfcTag(req.user.id, data);
  }

  @Patch('nfc-tags/:tagId')
  async renameMyNfcTag(@Request() req, @Param('tagId') tagId: string, @Body('label') label: string) {
    return this.connectAppService.renameMyNfcTag(req.user.id, { tagId, label });
  }

  @Delete('nfc-tags/:tagId')
  async revokeMyNfcTag(@Request() req, @Param('tagId') tagId: string) {
    return this.connectAppService.revokeMyNfcTag(req.user.id, tagId);
  }

  // --- Active Sessions ---
  @Get('device-sessions')
  async listMyDeviceSessions(
    @Request() req,
    @Query('deviceKey') deviceKey?: string,
    @Headers('x-device-key') currentKey?: string,
  ) {
    const key = deviceKey || currentKey || null;
    return this.connectAppService.listMyDeviceSessions(req.user.id, key);
  }

  @Post('device-sessions/touch')
  async touchMyDeviceSession(@Request() req, @Body() data: any) {
    return this.connectAppService.touchMyDeviceSession(req.user.id, data);
  }

  @Delete('device-sessions/:sessionId')
  async revokeMyDeviceSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Query('deviceKey') deviceKey?: string,
    @Headers('x-device-key') currentKey?: string,
  ) {
    const key = deviceKey || currentKey || null;
    return this.connectAppService.revokeMyDeviceSession(req.user.id, sessionId, key);
  }
}
