import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { GoogleSpreadsheetModule } from '../google-spreadsheet/google-spreadsheet.module';
import { GoogleSheetModule } from '../google-sheet/google-sheet.module';

@Module({
  imports: [GoogleSpreadsheetModule, GoogleSheetModule],
  providers: [CronService],
})
export class CronModule {}
