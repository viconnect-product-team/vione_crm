import { Controller, Post, Body, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller(['ai-assistant', 'connect-app/ai'])
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  /**
   * Action 1: AI Tự động gửi tin nhắn cho tài khoản chỉ định bằng lệnh giọng nói / chat
   */
  @Post('send-message')
  async aiSendMessage(
    @Request() req,
    @Body()
    data: {
      recipientQuery: string;
      message: string;
      voiceTranscript?: string;
    },
  ) {
    if (!data?.recipientQuery || !data?.message) {
      throw new BadRequestException('recipientQuery_and_message_required');
    }
    return this.connectAppService.aiDispatchSendMessage(
      req.user.id,
      data.recipientQuery,
      data.message,
      data.voiceTranscript,
    );
  }

  /**
   * Action 2: Share cơ hội vào AI & Gửi lời chào quan tâm cơ hội kèm VOICE TTS vào tin nhắn chờ người đăng
   */
  @Post('express-opportunity-voice')
  async aiExpressOpportunityVoice(
    @Request() req,
    @Body()
    data: {
      opportunityId: string;
      customGreeting?: string;
      voiceTranscript?: string;
    },
  ) {
    if (!data?.opportunityId) {
      throw new BadRequestException('opportunityId_required');
    }
    return this.connectAppService.aiExpressOpportunityInterestWithVoice(
      req.user.id,
      data.opportunityId,
      data.customGreeting,
      data.voiceTranscript,
    );
  }
}
