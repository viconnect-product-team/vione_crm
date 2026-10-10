import { Injectable, Logger } from '@nestjs/common';
import { ConnectDdlRepository } from '../repositories/connect-ddl.repository';

/**
 * ConnectDdlService — Domain service managing database schema health.
 * Delegates SQL DDL execution to ConnectDdlRepository.
 */
@Injectable()
export class ConnectDdlService {
  private readonly logger = new Logger(ConnectDdlService.name);

  constructor(private readonly ddlRepository: ConnectDdlRepository) {}

  async initSchemaTables(): Promise<void> {
    this.logger.log('Delegating schema table verification to ConnectDdlRepository...');
    await this.ddlRepository.executeSchemaInitialization();
  }
}
