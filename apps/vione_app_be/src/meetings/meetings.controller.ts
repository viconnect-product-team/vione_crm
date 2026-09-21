import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
@UseGuards(AuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get('workspace/summary')
  async getWorkspaceSummary(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.getWorkspaceSummary(userId);
  }

  @Post('workspace/list')
  async listWorkspaceMeetings(@Request() req: any, @Body() filters: any) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.listWorkspaceMeetings(userId, filters);
  }

  @Get(':id/workspace-detail')
  async getMeetingWorkspaceDetail(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.getMeetingWorkspaceDetail(userId, id);
  }

  @Get(':id/outcome')
  async getOutcome(@Param('id') id: string) {
    return this.meetingsService.getOutcome(id);
  }

  @Post(':id/outcome')
  async saveOutcome(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.saveOutcome(userId, id, data);
  }

  @Get(':id/follow-ups')
  async listFollowUps(@Param('id') id: string) {
    return this.meetingsService.listFollowUps(id);
  }

  @Post(':id/follow-ups')
  async createFollowUp(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.createFollowUp(userId, id, data);
  }

  @Patch('follow-ups/:followUpId/status')
  async updateFollowUpStatus(
    @Request() req: any,
    @Param('followUpId') followUpId: string,
    @Body('status') status: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.updateFollowUpStatus(userId, followUpId, status);
  }

  @Get('availability/preferences')
  async getAvailabilityPreferences(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.getAvailabilityPreferences(userId);
  }

  @Post('availability/preferences')
  async updateAvailabilityPreferences(@Request() req: any, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.updateAvailabilityPreferences(userId, data);
  }

  @Get(':id/time-proposals')
  async listTimeProposals(@Param('id') id: string) {
    return this.meetingsService.listTimeProposals(id);
  }

  @Get(':id/projections')
  async listProjections(@Param('id') id: string) {
    return this.meetingsService.listProjections(id);
  }

  @Post('time-proposals')
  async createTimeProposals(@Request() req: any, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.createTimeProposals(userId, data);
  }

  @Post('time-proposals/:id/respond')
  async respondToTimeProposal(
    @Request() req: any,
    @Param('id') id: string,
    @Body('response') response: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.respondToTimeProposal(userId, id, response);
  }

  @Post('time-proposals/:id/select')
  async selectTimeProposal(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.meetingsService.selectTimeProposal(userId, id);
  }
}
