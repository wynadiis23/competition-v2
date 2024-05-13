import { Body, Controller, Post } from '@nestjs/common';
import { StageRewardService } from './stage-reward.service';
import { CreateStageRewardDto } from './dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('stage-reward')
export class StageRewardController {
  constructor(private readonly stageRewardService: StageRewardService) {}

  //   @Post()
  //   @ApiBody({
  //     type: CreateStageRewardDto,
  //     required: true,
  //   })
  //   async create(@Body() dto: CreateStageRewardDto) {
  //     await this.stageRewardService.create(dto);

  //     return {
  //       message: 'successfuly created stage reward',
  //     };
  //   }
}
