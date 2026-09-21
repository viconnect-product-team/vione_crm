import { Controller, Get, Post, Delete, Body, Request, UseGuards, Param, Query, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller(['dm', 'connect-app/dm'])
@UseGuards(JwtAuthGuard)
export class DmController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  // ── Member Messaging (PWA) ──
  @Get('member/conversations')
  async listMemberConversations(@Request() req) {
    return this.connectAppService.listMemberConversations(req.user.id);
  }

  @Get('member/messages')
  async listMemberMessages(@Request() req, @Query('peerCode') peerCode: string) {
    if (!peerCode) throw new BadRequestException('peerCode_required');
    return this.connectAppService.listMemberMessages(req.user.id, peerCode);
  }

  @Post('member/messages')
  async sendMemberMessage(@Request() req, @Body() data: { peerCode: string; text: string }) {
    if (!data?.peerCode || !data?.text) throw new BadRequestException('peerCode_and_text_required');
    return this.connectAppService.sendMemberMessage(req.user.id, data.peerCode, data.text);
  }

  @Delete('member/messages/:messageId')
  async retractMemberMessage(@Request() req, @Param('messageId') messageId: string) {
    return this.connectAppService.retractMemberMessage(req.user.id, messageId);
  }

  @Get('threads')
  async listMyDmThreads(@Request() req) {
    return this.connectAppService.listMyDmThreads(req.user.id);
  }

  @Post('threads')
  async openMyDmThread(
    @Request() req,
    @Body('counterpartUserId') counterpartUserId?: string,
    @Body('personId') personId?: string,
  ) {
    let cleanId = counterpartUserId;
    if (personId) {
      cleanId = personId.startsWith('u:') ? personId.substring(2) : personId;
    }
    if (!cleanId) {
      throw new BadRequestException('counterpart_user_id_required');
    }
    return this.connectAppService.openMyDmThread(req.user.id, cleanId);
  }

  @Get('threads/:threadId')
  async getMyDmThreadDetail(@Request() req, @Param('threadId') threadId: string) {
    return this.connectAppService.getMyDmThreadDetail(req.user.id, threadId);
  }

  @Post('threads/:threadId/messages')
  async sendMyDmMessage(
    @Request() req,
    @Param('threadId') threadId: string,
    @Body() data: { body: string; clientToken: string },
  ) {
    return this.connectAppService.sendMyDmMessage(req.user.id, threadId, data);
  }

  @Post('threads/:threadId/read')
  async markMyDmThreadRead(@Request() req, @Param('threadId') threadId: string) {
    return this.connectAppService.markMyDmThreadRead(req.user.id, threadId);
  }

  @Delete('messages/:messageId')
  async retractMyDmMessage(@Request() req, @Param('messageId') messageId: string) {
    return this.connectAppService.retractMyDmMessage(req.user.id, messageId);
  }

  @Post('messages/:messageId/reactions')
  async reactToDmMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body('emoji') emoji: string,
  ) {
    if (!emoji) throw new BadRequestException('emoji_required');
    return this.connectAppService.reactToDmMessage(req.user.id, messageId, emoji);
  }
}
