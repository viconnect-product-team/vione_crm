import { Test, TestingModule } from '@nestjs/testing';
import { BusinessCardService } from './business-card.service';

describe('BusinessCardService', () => {
  let service: BusinessCardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessCardService],
    }).compile();

    service = module.get<BusinessCardService>(BusinessCardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
