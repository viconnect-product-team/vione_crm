import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { CommunityController } from './community.controller';
import { NetworkController } from './network.controller';
import { PublicController } from './public.controller';
import { MomentController } from './moment.controller';
import { NfcDeviceController } from './nfc-device.controller';
import { DmController } from './dm.controller';
import { CustomerController } from './customer.controller';
import { CardScanController } from './card-scan.controller';
import { OpportunityController } from './opportunity.controller';
import { ProductsController } from './products.controller';
import { MarketplaceController } from './marketplace.controller';
import { ContentController } from './content.controller';
import { ConnectAppService } from './connect-app.service';
import { ConnectAppGateway } from './connect-app.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [
    MeController,
    CommunityController,
    OpportunityController,
    NetworkController,
    PublicController,
    MomentController,
    NfcDeviceController,
    DmController,
    CustomerController,
    CardScanController,
    ProductsController,
    MarketplaceController,
    ContentController,
  ],
  providers: [ConnectAppService, ConnectAppGateway],
  exports: [ConnectAppService, ConnectAppGateway],
})
export class ConnectAppModule {}
