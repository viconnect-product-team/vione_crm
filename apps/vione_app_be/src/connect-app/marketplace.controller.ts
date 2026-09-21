import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get('products')
  async listProducts(@Query() query: any) {
    return this.connectAppService.listMarketplaceProducts(query);
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
    return this.connectAppService.getMarketplaceProductById(id);
  }

  @Post('products')
  async createProduct(@Request() req: any, @Body() body: any) {
    return this.connectAppService.createMarketplaceProduct(req.user.id, body);
  }

  @Put('products/:id')
  async updateProduct(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.connectAppService.updateMarketplaceProduct(req.user.id, id, body);
  }

  @Delete('products/:id')
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    return this.connectAppService.deleteMarketplaceProduct(req.user.id, id);
  }

  @Patch('products/:id/toggle-sold')
  async toggleProductSold(@Request() req: any, @Param('id') id: string) {
    return this.connectAppService.toggleProductSold(req.user.id, id);
  }

  @Get('quotes')
  async listQuotes(@Request() req: any) {
    return this.connectAppService.listProductQuotes(req.user.id);
  }

  @Post('quotes')
  async requestQuote(@Request() req: any, @Body() body: any) {
    return this.connectAppService.requestProductQuote(req.user.id, body);
  }

  @Post('products/quote')
  async requestProductQuoteAlias(@Request() req: any, @Body() body: any) {
    return this.connectAppService.requestProductQuote(req.user.id, body);
  }

  @Patch('quotes/:id/status')
  async updateQuoteStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.connectAppService.updateQuoteStatus(req.user.id, id, status);
  }

  @Post('quotes/:id/reminder')
  async sendQuoteReminder(@Request() req: any, @Param('id') id: string) {
    return this.connectAppService.sendQuoteReminder(req.user.id, id);
  }

  @Post('quotes/:id/cancel')
  async cancelQuote(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.connectAppService.cancelQuote(req.user.id, id, reason);
  }
}
