import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewsService, CreateReviewDto, UpdateReviewDto } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async listReviews(@Query('sellerId') sellerId: string) {
    return this.reviewsService.listReviews(sellerId);
  }

  @Post()
  async addReview(@Request() req: any, @Body() body: CreateReviewDto) {
    return this.reviewsService.addReview(req.user.id || req.user.sub, body);
  }

  @Put(':id')
  async updateReview(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(req.user.id || req.user.sub, id, body);
  }

  @Delete(':id')
  async deleteReview(@Request() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteReview(req.user.id || req.user.sub, id);
  }
}
