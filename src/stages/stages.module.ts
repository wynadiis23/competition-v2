import { Module } from '@nestjs/common';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [StagesService],
  controllers: [StagesController],
  exports: [StagesService],
})
export class StagesModule {}
