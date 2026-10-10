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
import { AiAssistantController } from './ai-assistant.controller';
import { ConnectAppService } from './connect-app.service';
import { ConnectAppGateway } from './connect-app.gateway';

// Domain Services
import { ConnectDdlService } from './services/connect-ddl.service';
import { ConnectCompanyInternalService } from './services/connect-company-internal.service';
import { ConnectMarketplaceService } from './services/connect-marketplace.service';
import { ConnectOpportunityService } from './services/connect-opportunity.service';
import { ConnectMomentService } from './services/connect-moment.service';
import { ConnectDmService } from './services/connect-dm.service';
import { ConnectCustomerService } from './services/connect-customer.service';

// Repositories (Data Access Layer)
import { ConnectDdlRepository } from './repositories/connect-ddl.repository';
import { ConnectCompanyInternalRepository } from './repositories/connect-company-internal.repository';
import { ConnectOpportunityRepository } from './repositories/connect-opportunity.repository';
import { ConnectMomentRepository } from './repositories/connect-moment.repository';
import { ConnectDmRepository } from './repositories/connect-dm.repository';
import { ConnectCustomerRepository } from './repositories/connect-customer.repository';
import { ConnectMarketplaceRepository } from './repositories/connect-marketplace.repository';

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
    AiAssistantController,
  ],
  providers: [
    ConnectAppService,
    ConnectAppGateway,
    // Repositories
    ConnectDdlRepository,
    ConnectCompanyInternalRepository,
    ConnectOpportunityRepository,
    ConnectMomentRepository,
    ConnectDmRepository,
    ConnectCustomerRepository,
    ConnectMarketplaceRepository,
    // Domain Services
    ConnectDdlService,
    ConnectCompanyInternalService,
    ConnectMarketplaceService,
    ConnectOpportunityService,
    ConnectMomentService,
    ConnectDmService,
    ConnectCustomerService,
  ],
  exports: [
    ConnectAppService,
    ConnectAppGateway,
    // Repositories
    ConnectDdlRepository,
    ConnectCompanyInternalRepository,
    ConnectOpportunityRepository,
    ConnectMomentRepository,
    ConnectDmRepository,
    ConnectCustomerRepository,
    ConnectMarketplaceRepository,
    // Domain Services
    ConnectDdlService,
    ConnectCompanyInternalService,
    ConnectMarketplaceService,
    ConnectOpportunityService,
    ConnectMomentService,
    ConnectDmService,
    ConnectCustomerService,
  ],
})
export class ConnectAppModule {}
