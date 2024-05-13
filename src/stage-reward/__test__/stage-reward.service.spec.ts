import { Test, TestingModule } from '@nestjs/testing';
import { StageRewardService } from '../stage-reward.service';

describe('StageRewardService', () => {
  let service: StageRewardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StageRewardService],
    }).compile();

    service = module.get<StageRewardService>(StageRewardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
