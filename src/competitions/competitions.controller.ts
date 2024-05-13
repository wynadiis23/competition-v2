import { Controller, Get } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Competitions')
@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get('/list/competition')
  async listGS() {
    return await this.competitionsService.listCompetitionRedis();
  }
}
