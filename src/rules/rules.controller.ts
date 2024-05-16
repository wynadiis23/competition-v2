import { Controller, Get, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RulesService } from './rules.service';

@Controller('rules')
@ApiTags('Rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Version('2')
  @Get()
  @ApiOperation({ summary: 'Get all rules' })
  async getRules() {
    return await this.rulesService.getRules();
  }
}
