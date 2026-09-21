import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ConnectAppService } from './connect-app.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('public')
export class PublicController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get('association/:slug')
  async getPublicAssociation(@Param('slug') slug: string) {
    return this.connectAppService.getPublicAssociationBySlug(slug);
  }

  @Get('association/resolve-host')
  async resolveAssociationByHost(@Query('host') host: string) {
    return this.connectAppService.resolveAssociationByHost(host);
  }

  @Get('identity/:token')
  async getPublicIdentityByToken(@Param('token') token: string) {
    return this.connectAppService.getPublicIdentityByToken(token);
  }

  /** Anonymous guest shares their contact back to the card owner. No auth required. */
  @Post('card/:slug/contact')
  async shareGuestContact(@Param('slug') slug: string, @Body() body: any) {
    return this.connectAppService.shareGuestContact(slug, body);
  }

  /** Public club registration endpoint from landing pages. No auth required. */
  @Post('club-registration')
  async submitClubRegistration(@Body() body: any) {
    return this.connectAppService.submitClubRegistration(body);
  }

  @Post('leads/club-registration')
  async submitClubRegistrationAlias(@Body() body: any) {
    return this.connectAppService.submitClubRegistration(body);
  }

  @Get('club-registration/status')
  async getClubRegistrationStatus(@Query('phone') phone?: string, @Query('email') email?: string) {
    return this.connectAppService.checkClubRegistrationStatus({ phone, email });
  }

  @Post('club-registration/status')
  async checkClubRegistrationStatusPost(@Body() body: { phone?: string; email?: string }) {
    return this.connectAppService.checkClubRegistrationStatus(body);
  }

  /** Admin renewal audit scope — requires JWT. */
  @Get('admin/renewal-scope')
  @UseGuards(JwtAuthGuard)
  async getAdminRenewalScope(@Request() req) {
    return this.connectAppService.getAdminRenewalScope(req.user.id);
  }

  /** Admin renewal audit search — requires JWT. */
  @Post('admin/renewal-audit')
  @UseGuards(JwtAuthGuard)
  async searchRenewalAuditLog(@Request() req, @Body() body: any) {
    return this.connectAppService.searchRenewalAuditLog(req.user.id, body);
  }
}

