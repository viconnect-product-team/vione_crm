import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VotingService, CreatePollDto, CastVoteDto } from './voting.service';

@Controller('voting')
@UseGuards(JwtAuthGuard)
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Get('polls')
  async listPolls(@Request() req: any, @Query('associationId') associationId?: string) {
    return this.votingService.listPolls(req.user.id || req.user.sub, associationId);
  }

  @Get('polls/:id')
  async getPollById(@Request() req: any, @Param('id') id: string) {
    return this.votingService.getPollById(req.user.id || req.user.sub, id);
  }

  @Post('polls')
  async createPoll(@Request() req: any, @Body() body: CreatePollDto) {
    return this.votingService.createPoll(req.user.id || req.user.sub, body);
  }

  @Put('polls/:id')
  async updatePoll(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.votingService.updatePoll(req.user.id || req.user.sub, id, body);
  }

  @Post('polls/:id/close')
  async closePoll(@Request() req: any, @Param('id') id: string) {
    return this.votingService.closePoll(req.user.id || req.user.sub, id);
  }

  @Delete('polls/:id')
  async deletePoll(@Request() req: any, @Param('id') id: string) {
    return this.votingService.deletePoll(req.user.id || req.user.sub, id);
  }

  @Post('polls/:id/vote')
  async castVote(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: CastVoteDto,
  ) {
    return this.votingService.castVote(
      req.user.id || req.user.sub,
      id,
      body.optionId,
      body.sourceApp,
    );
  }

  @Post('lucky-draw/notify')
  async notifyLuckyDrawWinner(
    @Request() req: any,
    @Body()
    body: {
      winnerName: string;
      winnerCompany?: string;
      winnerCode?: string;
      luckyNumber?: string;
      prize: string;
      eventName?: string;
      eventId?: string;
    },
  ) {
    return this.votingService.notifyLuckyDrawWinner(req.user.id || req.user.sub, body);
  }
}
