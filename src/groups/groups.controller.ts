import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Version,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { StagesService } from '../stages/stages.service';

@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly stageService: StagesService,
  ) {}

  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @ApiParam({
    name: 'stage',
    required: true,
    type: 'string',
    description: 'stage',
    example: 'PenyisihanPertama',
  })
  @Get('/list/:competition/:stage')
  async listGroupRedis(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
  ) {
    return await this.groupsService.listGroupRedis(competition, stage);
  }

  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @ApiParam({
    name: 'stage',
    required: true,
    type: 'string',
    description: 'stage',
    example: 'PenyisihanPertama',
  })
  @Get('/day-of-matches/:competition/:stage')
  async dayOfMatches(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
  ) {
    return await this.groupsService.dayOfMatches(competition, stage);
  }

  @Version('2')
  @ApiOperation({
    summary:
      'Get list of group on competition, return list of group from the latest stage',
  })
  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @Get('/list/:competition')
  async listGroupRedisV2(@Param('competition') competition: string) {
    // get latest stage
    const stages = await this.stageService.listStageRedis(competition);
    if (!stages.length) {
      throw new BadRequestException(
        `No stage found by this ${competition} competition`,
      );
    }

    const stage = stages[stages.length - 1];

    return await this.groupsService.listGroupRedis(competition, stage.id);
  }
}
