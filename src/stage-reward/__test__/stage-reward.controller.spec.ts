import { Test, TestingModule } from '@nestjs/testing';
import { StageRewardController } from '../stage-reward.controller';

describe('StageRewardController', () => {
  let controller: StageRewardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StageRewardController],
    }).compile();

    controller = module.get<StageRewardController>(StageRewardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
