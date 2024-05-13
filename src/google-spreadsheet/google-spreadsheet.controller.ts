import { Controller, Get } from '@nestjs/common';
import { GoogleSpreadsheetService } from './google-spreadsheet.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('google-spreadsheet')
export class GoogleSpreadsheetController {
  constructor(private readonly gSpreadSheetService: GoogleSpreadsheetService) {}

  @ApiOperation({
    summary: 'OLD use to get data from google sheet. Using delay to avoid 429',
  })
  @Get()
  async test() {
    return await this.gSpreadSheetService.getData();
  }
}
