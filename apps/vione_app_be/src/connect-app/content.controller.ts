import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get('news')
  async listNews() {
    return this.connectAppService.listPublishedNews();
  }

  @Get('admin/news')
  async listAdminNews() {
    return this.connectAppService.listAdminNews();
  }

  @Post('admin/news')
  async createAdminNews(@Body() body: any) {
    return this.connectAppService.createNewsAdmin(body);
  }

  @Put('admin/news/:id')
  async updateAdminNewsPut(@Param('id') id: string, @Body() body: any) {
    return this.connectAppService.updateNewsAdmin(id, body);
  }

  @Patch('admin/news/:id')
  async updateAdminNewsPatch(@Param('id') id: string, @Body() body: any) {
    return this.connectAppService.updateNewsAdmin(id, body);
  }

  @Delete('admin/news/:id')
  async deleteAdminNews(@Param('id') id: string) {
    return this.connectAppService.deleteNewsAdmin(id);
  }

  @Get('perks')
  async listPerks() {
    return this.connectAppService.listActivePerks();
  }

  @Get('admin/perks')
  async listAdminPerks() {
    return this.connectAppService.listAllPerksAdmin();
  }

  @Post('admin/perks')
  async createAdminPerk(@Body() body: any) {
    return this.connectAppService.createPerkAdmin(body);
  }

  @Patch('admin/perks/:id')
  async updateAdminPerk(@Param('id') id: string, @Body() body: any) {
    return this.connectAppService.updatePerkAdmin(id, body);
  }

  @Delete('admin/perks/:id')
  async deleteAdminPerk(@Param('id') id: string) {
    return this.connectAppService.deletePerkAdmin(id);
  }

  @Get('perks/:id')
  async getPerk(@Param('id') id: string) {
    return this.connectAppService.getPerkById(id);
  }
}

