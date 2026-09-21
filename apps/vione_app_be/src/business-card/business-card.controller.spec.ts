import { Test, TestingModule } from '@nestjs/testing';
import { BusinessCardController } from './business-card.controller';

describe('BusinessCardController', () => {
  let controller: BusinessCardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessCardController],
    }).compile();

    controller = module.get<BusinessCardController>(BusinessCardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
