import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  SponsorsService,
  CreateSponsorPackageDto,
  UpdateSponsorPackageDto,
  CreateSponsorDto,
  OnboardSponsorDto,
} from './sponsors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sponsors')
@UseGuards(JwtAuthGuard)
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  // ── SPONSOR PACKAGES ────────────────────────────────────────────────────────

  @Get('packages')
  async listPackages() {
    return this.sponsorsService.listPackages();
  }

  @Get('packages/:id')
  async getPackageById(@Param('id') id: string) {
    return this.sponsorsService.getPackageById(id);
  }

  @Post('packages')
  async createPackage(@Body() body: CreateSponsorPackageDto) {
    return this.sponsorsService.createPackage(body);
  }

  @Put('packages/:id')
  async updatePackage(@Param('id') id: string, @Body() body: UpdateSponsorPackageDto) {
    return this.sponsorsService.updatePackage(id, body);
  }

  @Delete('packages/:id')
  async deletePackage(@Param('id') id: string) {
    return this.sponsorsService.deletePackage(id);
  }

  // ── SPONSORS ────────────────────────────────────────────────────────────────

  @Get()
  async listSponsors() {
    return this.sponsorsService.listSponsors();
  }

  @Get(':id')
  async getSponsorById(@Param('id') id: string) {
    return this.sponsorsService.getSponsorById(id);
  }

  @Post()
  async createSponsor(@Body() body: CreateSponsorDto) {
    return this.sponsorsService.createSponsor(body);
  }

  @Put(':id')
  async updateSponsor(@Param('id') id: string, @Body() body: Partial<CreateSponsorDto>) {
    return this.sponsorsService.updateSponsor(id, body);
  }

  @Delete(':id')
  async deleteSponsor(@Param('id') id: string) {
    return this.sponsorsService.deleteSponsor(id);
  }

  @Post('onboard')
  async onboardSponsor(@Body() body: OnboardSponsorDto) {
    return this.sponsorsService.onboardSponsor(body);
  }
}
