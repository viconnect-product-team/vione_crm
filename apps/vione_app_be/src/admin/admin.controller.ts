import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';


export class UpdateDemoLeadDto {
  status?: string;
  adminNotes?: string | null;
}

export class CreateInvoiceDto {
  memberId!: string;
  year?: number;
  amount?: number;
  dueDate?: string;
}

export class AddInvoiceReminderDto {
  channel!: string;
  byName?: string;
  note?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('demo-leads')
  async listDemoLeads(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.listDemoLeads({ status, search, from, to });
  }

  @Patch('demo-leads/:id')
  async updateDemoLead(
    @Param('id') id: string,
    @Body() data: UpdateDemoLeadDto,
  ) {
    return this.adminService.updateDemoLead(id, data);
  }

  // ── INVOICES / FEES ────────────────────────────────────────────────────────

  @Get('invoices')
  async listInvoices() {
    return this.adminService.listInvoices();
  }

  @Get('invoices/:id')
  async getInvoiceById(@Param('id') id: string) {
    return this.adminService.getInvoiceById(id);
  }

  @Post('invoices')
  async createInvoice(
    @Body() body: CreateInvoiceDto,
  ) {
    return this.adminService.createInvoice(body);
  }

  @Post('invoices/:id/pay')
  async markInvoicePaid(
    @Param('id') id: string,
    @Body('method') method?: 'bank' | 'card' | 'cash' | 'ewallet',
  ) {
    return this.adminService.markInvoicePaid(id, method);
  }

  @Patch('invoices/:id/method')
  async updateInvoiceMethod(
    @Param('id') id: string,
    @Body('method') method: 'bank' | 'card' | 'cash' | 'ewallet',
  ) {
    return this.adminService.updateInvoiceMethod(id, method);
  }

  @Post('invoices/:id/reminders')
  async addInvoiceReminder(
    @Param('id') id: string,
    @Body() body: AddInvoiceReminderDto,
  ) {
    return this.adminService.addInvoiceReminder(id, body);
  }

  // ── CRM NOTIFICATIONS ────────────────────────────────────────────────────────

  @Get('notifications')
  async listNotifications(
    @Request() req,
    @Query('associationId') associationId?: string,
    @Query('appScope') appScope?: string,
  ) {
    return this.adminService.listNotifications(req.user.id, associationId, appScope);
  }

  @Post('notifications')
  async createNotification(
    @Request() req,
    @Body() body: any,
  ) {
    return this.adminService.createNotification(req.user.id, body);
  }

  @Patch('notifications/:id')
  async updateNotification(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.updateNotification(id, body);
  }

  @Post('notifications/:id/send')
  async sendNotification(
    @Param('id') id: string,
  ) {
    return this.adminService.sendNotification(id);
  }

  @Delete('notifications/:id')
  async deleteNotification(
    @Param('id') id: string,
  ) {
    return this.adminService.deleteNotification(id);
  }

  // ── EMAIL MARKETING CAMPAIGNS ─────────────────────────────────────────

  @Get('campaigns')
  async listCampaigns() {
    return this.adminService.listCampaigns();
  }

  @Post('campaigns')
  async createCampaign(@Body() body: any) {
    return this.adminService.createCampaign(body);
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@Param('id') id: string) {
    return this.adminService.deleteCampaign(id);
  }
}



