import { Controller, Get, Post, Put, Patch, Delete, Body, Request, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateCustomerLogDto,
  CreateCustomerTagDto,
  RenameCustomerTagDto,
  CreateCustomerNeedDto,
  UpdateCustomerNeedDto,
} from './dto';

@Controller(['customers', 'connect-app/customer', 'connect-app/customers'])
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  // --- Static tags routes MUST come before :customerId wildcard routes ---
  @Get('tags')
  async listBcCustomerTags(@Request() req) {
    return this.connectAppService.listBcCustomerTags(req.user.id);
  }

  @Post('tags')
  async createBcCustomerTag(@Request() req, @Body() dto: CreateCustomerTagDto) {
    return this.connectAppService.createBcCustomerTag(req.user.id, dto.name);
  }

  @Patch('tags/:tagId')
  async renameBcCustomerTag(
    @Request() req,
    @Param('tagId') tagId: string,
    @Body() dto: RenameCustomerTagDto,
  ) {
    return this.connectAppService.renameBcCustomerTag(req.user.id, tagId, dto.name);
  }

  @Delete('tags/:tagId')
  async deleteBcCustomerTag(@Request() req, @Param('tagId') tagId: string) {
    return this.connectAppService.deleteBcCustomerTag(req.user.id, tagId);
  }

  // --- Static needs routes MUST come before :customerId wildcard routes ---
  @Patch('needs/:needId')
  async updateBcCustomerNeed(
    @Request() req,
    @Param('needId') needId: string,
    @Body() dto: UpdateCustomerNeedDto,
  ) {
    return this.connectAppService.updateBcCustomerNeed(req.user.id, { ...dto, needId });
  }

  @Delete('needs/:needId')
  async deleteBcCustomerNeed(@Request() req, @Param('needId') needId: string) {
    return this.connectAppService.deleteBcCustomerNeed(req.user.id, needId);
  }

  // --- Base collection routes ---
  @Get()
  async listBcCustomers(@Request() req) {
    return this.connectAppService.listBcCustomers(req.user.id);
  }

  @Post()
  async createBcCustomer(@Request() req, @Body() dto: CreateCustomerDto) {
    return this.connectAppService.createBcCustomer(req.user.id, dto);
  }

  // --- Sub-resources on :customerId ---
  @Get(':customerId/logs')
  async listBcCustomerLogs(@Request() req, @Param('customerId') customerId: string) {
    return this.connectAppService.listBcCustomerLogs(req.user.id, customerId);
  }

  @Post(':customerId/logs')
  async addBcCustomerLog(
    @Request() req,
    @Param('customerId') customerId: string,
    @Body() dto: CreateCustomerLogDto,
  ) {
    return this.connectAppService.addBcCustomerLog(req.user.id, { ...dto, customerId });
  }

  @Put(':customerId/tags')
  async setBcCustomerTags(
    @Request() req,
    @Param('customerId') customerId: string,
    @Body('names') names: string[],
  ) {
    return this.connectAppService.setBcCustomerTags(req.user.id, customerId, names || []);
  }

  @Get(':customerId/needs')
  async listBcCustomerNeeds(@Request() req, @Param('customerId') customerId: string) {
    return this.connectAppService.listBcCustomerNeeds(req.user.id, customerId);
  }

  @Post(':customerId/needs')
  async addBcCustomerNeed(
    @Request() req,
    @Param('customerId') customerId: string,
    @Body() dto: CreateCustomerNeedDto,
  ) {
    return this.connectAppService.addBcCustomerNeed(req.user.id, { ...dto, customerId });
  }

  // --- AI Tag Suggestions ---
  @Post(':customerId/tag-suggestions')
  async suggestCustomerTags(
    @Request() req,
    @Param('customerId') customerId: string,
  ) {
    return this.connectAppService.suggestCustomerTags(req.user.id, customerId);
  }

  @Get(':customerId/tag-suggestions/history')
  async listCustomerTagSuggestHistory(
    @Request() req,
    @Param('customerId') customerId: string,
  ) {
    return this.connectAppService.listCustomerTagSuggestHistory(req.user.id, customerId);
  }

  @Post(':customerId/tag-suggestions/feedback')
  async saveCustomerTagSuggestFeedback(
    @Request() req,
    @Param('customerId') customerId: string,
    @Body() data: any,
  ) {
    return this.connectAppService.saveCustomerTagSuggestFeedback(req.user.id, { ...data, customerId });
  }

  @Get(':customerId/tag-suggestions/feedback')
  async listCustomerTagSuggestFeedback(
    @Request() req,
    @Param('customerId') customerId: string,
  ) {
    return this.connectAppService.listCustomerTagSuggestFeedback(req.user.id, customerId);
  }

  // --- Parametrized single customer mutation routes ---
  @Patch(':customerId')
  async updateBcCustomer(
    @Request() req,
    @Param('customerId') customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.connectAppService.updateBcCustomer(req.user.id, { ...dto, customerId });
  }

  @Delete(':customerId')
  async deleteBcCustomer(@Request() req, @Param('customerId') customerId: string) {
    return this.connectAppService.deleteBcCustomer(req.user.id, customerId);
  }
}
