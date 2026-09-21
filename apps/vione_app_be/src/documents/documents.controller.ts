import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async list(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.documentsService.list(userId);
  }

  @Post()
  async create(@Request() req: any, @Body() data: any) {
    const userId = req.user.id || req.user.sub;
    if (!data.name || !data.category || !data.type) {
      throw new BadRequestException('Missing required fields: name, category, or type');
    }
    return this.documentsService.create(userId, data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    if (!data.name || !data.category || !data.type) {
      throw new BadRequestException('Missing required fields: name, category, or type');
    }
    return this.documentsService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }

  @Get(':id/url')
  async getUrl(@Param('id') id: string) {
    const url = await this.documentsService.getUrl(id);
    return { url };
  }
}
