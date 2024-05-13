import { Controller, Get } from '@nestjs/common';
import { GoogleSheetService } from './google-sheet.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('google-sheet')
export class GoogleSheetController {
  constructor(private readonly googleSheetService: GoogleSheetService) {}

  @ApiOperation({
    summary: 'NEW using one request to get all data from goole sheet',
  })
  @Get()
  async getData() {
    return await this.googleSheetService.getData();
  }
}
