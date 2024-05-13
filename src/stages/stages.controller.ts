import { Controller, Get, Param } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { StagesService } from './stages.service';

@ApiTags('Stages')
@Controller('stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @Get('/list/:competition')
  async listStageRedis(@Param('competition') competition: string) {
    return await this.stagesService.listStageRedis(competition);
  }
}
