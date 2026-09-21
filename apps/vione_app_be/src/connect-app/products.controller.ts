import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectAppService } from './connect-app.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly connectAppService: ConnectAppService) {}

  @Get()
  async listActiveProducts() {
    return this.connectAppService.listActiveProducts();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.connectAppService.getMarketplaceProductById(id);
  }

  @Post('quote')
  async requestProductQuote(
    @Request() req: any,
    @Body() body: { productId: string; quantity?: number; message?: string },
  ) {
    return this.connectAppService.requestProductQuote(req.user.id, body);
  }

  @Post()
  async createProduct(@Request() req: any, @Body() body: any) {
    return this.connectAppService.createProduct(req.user.id, body);
  }

  @Patch(':id')
  async updateProduct(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.connectAppService.updateProduct(req.user.id, id, body);
  }

  @Delete(':id')
  async deleteProduct(@Request() req: any, @Param('id') id: string) {
    return this.connectAppService.deleteProduct(req.user.id, id);
  }
}
