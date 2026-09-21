import { Module } from '@nestjs/common';
import { BusinessCardController } from './business-card.controller';
import { BusinessCardService } from './business-card.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BusinessCardController],
  providers: [BusinessCardService],
})
export class BusinessCardModule {}
