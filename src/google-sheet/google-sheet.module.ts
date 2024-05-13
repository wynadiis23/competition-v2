import { Module } from '@nestjs/common';
import { GoogleSheetService } from './google-sheet.service';
import { GoogleSheetController } from './google-sheet.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [GoogleSheetService],
  controllers: [GoogleSheetController],
  exports: [GoogleSheetService],
})
export class GoogleSheetModule {}
