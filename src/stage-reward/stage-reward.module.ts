import { Module } from '@nestjs/common';
import { StageRewardService } from './stage-reward.service';
import { StageRewardController } from './stage-reward.controller';

@Module({
  imports: [],
  providers: [StageRewardService],
  controllers: [StageRewardController],
})
export class StageRewardModule {}
