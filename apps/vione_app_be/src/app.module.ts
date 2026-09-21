import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessCardModule } from './business-card/business-card.module';
import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';
import { ConnectAppModule } from './connect-app/connect-app.module';
import { DocumentsModule } from './documents/documents.module';
import { EventsModule } from './events/events.module';
import { MembersModule } from './members/members.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { SponsorsModule } from './sponsors/sponsors.module';
import { ReviewsModule } from './reviews/reviews.module';
import { VotingModule } from './voting/voting.module';
import { MeetingsModule } from './meetings/meetings.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    BusinessCardModule,
    UploadModule,
    MailModule,
    ConnectAppModule,
    DocumentsModule,
    EventsModule,
    MembersModule,
    AiModule,
    MeetingsModule,
    AdminModule,
    SponsorsModule,
    ReviewsModule,
    VotingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

