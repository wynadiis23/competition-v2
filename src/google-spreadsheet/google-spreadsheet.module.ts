import { Module } from '@nestjs/common';
import { GoogleSpreadsheetService } from './google-spreadsheet.service';
import { GoogleSpreadsheetController } from './google-spreadsheet.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [GoogleSpreadsheetService],
  controllers: [GoogleSpreadsheetController],
  exports: [GoogleSpreadsheetService],
})
export class GoogleSpreadsheetModule {}
