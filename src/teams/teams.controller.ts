import { Controller, Get, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}
}
