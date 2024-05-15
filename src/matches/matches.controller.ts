import { Controller, Get, Param, Query, Version } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StagesService } from '../stages/stages.service';
import { GroupsService } from '../groups/groups.service';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly stageService: StagesService,
    private readonly groupService: GroupsService,
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
  @ApiParam({
    name: 'group',
    required: true,
    type: 'string',
    description: 'stage',
    example: 'Group_1_Store',
  })
  @Get('/result/:competition/:stage/:group')
  async matchResultRedis(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
    @Param('group') group: string,
  ) {
    return await this.matchesService.matchResultStanding(
      competition,
      stage,
      group,
    );
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
  @ApiParam({
    name: 'group',
    required: true,
    type: 'string',
    description: 'stage',
    example: 'Group_1_Store',
  })
  @Get('/list/:competition/:stage/:group')
  async listMatchesRedis(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
    @Param('group') group: string,
  ) {
    return await this.matchesService.listMatches(competition, stage, group);
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
  @Get('/result-wildcard/:competition/:stage')
  async someFunction(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
  ) {
    return await this.matchesService.wildcardMatchResult(competition, stage);
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
  @Get('/result-summary/:competition/:stage')
  async resultSummary(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
  ) {
    return await this.matchesService.resultSummary(competition, stage);
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
  @Get('/result-summary-with-all-wildcard/:competition/:stage')
  async resultSummaryWithAllWildcard(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
  ) {
    return await this.matchesService.resultSummaryWithAllWildcard(
      competition,
      stage,
    );
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
  @Get('/result-summary/all/:competition/:stage')
  async getAllResultStanding(
    @Param('competition') competition: string,
    @Param('stage') stage: string,
  ) {
    return await this.matchesService.getAllResultStanding(competition, stage);
  }

  /////////////////////////////v2////////////////////////////////

  @Version('2')
  @ApiOperation({
    summary:
      '[ADMIN]Get match result/standing based on latest stage of the competition and group',
  })
  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @ApiParam({
    name: 'group',
    required: true,
    type: 'string',
    description: 'group',
    example: 'Group_1_Store',
  })
  @Get('/admin/result/:competition/:group')
  async matchResultRedisAdminV2(
    @Param('competition') competition: string,
    @Param('group') group: string,
  ) {
    // get latest stage of competition
    const stages = await this.stageService.listStageRedis(competition);
    console.log(competition);
    const stage = stages[stages.length - 1];

    const standing = await this.matchesService.matchResultStandingV2(
      competition,
      stage.id,
      group,
      true,
    );

    return {
      competition,
      stage,
      group,
      standing,
    };
  }

  @Version('2')
  @ApiOperation({
    summary:
      '[CLIENT]Get match result/standing based on latest stage of the competition and group',
  })
  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @ApiParam({
    name: 'group',
    required: true,
    type: 'string',
    description: 'group',
    example: 'Group_1_Store',
  })
  @Get('/client/result/:competition/:group')
  async matchResultRedisClientV2(
    @Param('competition') competition: string,
    @Param('group') group: string,
  ) {
    // get latest stage of competition
    const stages = await this.stageService.listStageRedis(competition);
    console.log(competition);
    const stage = stages[stages.length - 1];

    const standing = await this.matchesService.matchResultStandingV2(
      competition,
      stage.id,
      group,
    );

    return {
      competition,
      stage,
      group,
      standing,
    };
  }

  @Version('2')
  @ApiOperation({
    summary:
      '[ADMIN] Get list match of team based on competition, stage and group',
  })
  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @ApiParam({
    name: 'group',
    required: true,
    type: 'string',
    description: 'group',
    example: 'Group_1_Store',
  })
  @ApiQuery({
    name: 'team',
    required: true,
    type: 'string',
    description: 'team',
    example: 'PAKU',
  })
  @Get('/admin/list/:competition/:group')
  async listTeamMatchesAdmin(
    @Param('competition') competition: string,
    @Param('group') group: string,
    @Query('team') team: string,
  ) {
    // get latest stage of competition
    const stages = await this.stageService.listStageRedis(competition);
    const stage = stages[stages.length - 1];

    const matches = await this.matchesService.listTeamMatches(
      competition,
      stage.id,
      group,
      team,
      true,
    );

    return {
      competition,
      stage,
      group,
      team,
      matches,
    };
  }

  @Version('2')
  @ApiOperation({
    summary:
      '[CLIENT] Get list match of team based on competition, stage and group',
  })
  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @ApiParam({
    name: 'group',
    required: true,
    type: 'string',
    description: 'group',
    example: 'Group_1_Store',
  })
  @ApiQuery({
    name: 'team',
    required: true,
    type: 'string',
    description: 'team',
    example: 'PMEKASAN',
  })
  @Get('/client/list/:competition/:group')
  async listTeamMatchesClient(
    @Param('competition') competition: string,
    @Param('group') group: string,
    @Query('team') team: string,
  ) {
    // get latest stage of competition
    const stages = await this.stageService.listStageRedis(competition);
    const stage = stages[stages.length - 1];

    const matches = await this.matchesService.listTeamMatches(
      competition,
      stage.id,
      group,
      team,
      false,
    );

    return {
      competition,
      stage,
      group,
      team,
      matches,
    };
  }

  @Version('2')
  @ApiOperation({
    summary: 'Get list matches of latest stage based on competition and group',
  })
  @ApiParam({
    name: 'competition',
    required: true,
    type: 'string',
    description: 'competition',
    example: 'Champion',
  })
  @ApiParam({
    name: 'group',
    required: true,
    type: 'string',
    description: 'stage',
    example: 'Group_1_Store',
  })
  @Get('/list/all/:competition/:group')
  async listAdminMatchesRedisV2(
    @Param('competition') competition: string,
    @Param('group') group: string,
  ) {
    const stages = await this.stageService.listStageRedis(competition);
    const stage = stages[stages.length - 1];

    const matches = await this.matchesService.listMatches(
      competition,
      stage.id,
      group,
    );

    return {
      competition,
      stage,
      group,
      matches,
    };
  }

  // @Version('2')
  // @ApiOperation({
  //   summary:
  //     '[CLIENT]Get list matches of latest stage based on competition and group',
  // })
  // @ApiParam({
  //   name: 'competition',
  //   required: true,
  //   type: 'string',
  //   description: 'competition',
  //   example: 'Champion',
  // })
  // @ApiParam({
  //   name: 'group',
  //   required: true,
  //   type: 'string',
  //   description: 'stage',
  //   example: 'Group_1_Store',
  // })
  // @Get('/client/list/all/:competition/:group')
  // async listClientMatchesRedisV2(
  //   @Param('competition') competition: string,
  //   @Param('group') group: string,
  // ) {
  //   const stages = await this.stageService.listStageRedis(competition);
  //   const stage = stages[stages.length - 1];

  //   const matches = await this.matchesService.listMatchesClient(
  //     competition,
  //     stage.id,
  //     group,
  //   );

  //   return {
  //     competition,
  //     stage,
  //     group,
  //     matches,
  //   };
  // }
}
