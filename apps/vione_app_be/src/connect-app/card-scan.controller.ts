import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller('card-scans')
@UseGuards(JwtAuthGuard)
export class CardScanController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Post()
  async cardScanOcr(@Request() req, @Body() body: { imageDataUrl: string; clientToken: string }) {
    return this.connectAppService.cardScanOcr(req.user.id, body.imageDataUrl, body.clientToken);
  }

  @Post('resolve')
  async cardScanResolve(
    @Request() req,
    @Body() body: { email: string | null; phone: string | null; displayName?: string | null; companyName?: string | null },
  ) {
    return this.connectAppService.cardScanResolve(req.user.id, body);
  }

  @Post('save')
  async cardScanSave(@Request() req, @Body() body: any) {
    return this.connectAppService.cardScanSave(req.user.id, body);
  }
}
