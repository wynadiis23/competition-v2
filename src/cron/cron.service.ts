import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GoogleSpreadsheetService } from '../google-spreadsheet/google-spreadsheet.service';
import { Cron } from '@nestjs/schedule';
import { CustomCronExpression } from './const';
import { GoogleSheetService } from '../google-sheet/google-sheet.service';

@Injectable()
export class CronService {
  constructor(
    private readonly googleSpreadsheetService: GoogleSpreadsheetService,
    private readonly googleSheetService: GoogleSheetService,
  ) {}

  logger = new Logger(CronService.name);

  @Cron(CustomCronExpression.EVERY_5_MINUTES_FROM_1_TO_59, {
    name: 'GET_DATA_SPREADSHEET',
  })
  async getGSheetData() {
    let message: string;
    try {
      this.logger.log(
        'cron.service.getGSheetData: GET_DATA_SPREADSHEET is running',
      );

      await this.googleSheetService.getData();
    } catch (error) {
      message = `cron.service.getGSheetData error: ${error.message}`;
      this.logger.error(message);

      throw new InternalServerErrorException(message);
    }
  }
}
