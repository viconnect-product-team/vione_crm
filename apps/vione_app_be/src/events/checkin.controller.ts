import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('checkin')
@UseGuards(AuthGuard)
export class CheckinController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('state')
  async getCheckinState(@Request() req: any) {
    return this.eventsService.getCheckinState(req.user?.id || req.user?.sub || 'default');
  }

  @Get('qr-events')
  async getCheckinQrEvents(@Request() req: any) {
    return this.eventsService.getCheckinQrEvents(req.user?.id || req.user?.sub || 'default');
  }

  @Post()
  async checkIn(@Body('attendeeId') attendeeId: string) {
    return this.eventsService.checkInAttendee(attendeeId);
  }

  @Post('undo')
  async undoCheckIn(@Body('attendeeId') attendeeId: string) {
    return this.eventsService.undoCheckInAttendee(attendeeId);
  }

  @Post('record')
  async recordMemberCheckin(@Request() req: any, @Body() body: any) {
    return this.eventsService.recordMemberCheckin(req.user?.id || req.user?.sub, body);
  }

  @Get('my-checkins')
  async listMyMemberCheckins(@Request() req: any) {
    return this.eventsService.listMyMemberCheckins(req.user?.id || req.user?.sub);
  }
}
