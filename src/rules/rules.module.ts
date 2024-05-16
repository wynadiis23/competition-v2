import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [RulesService],
  controllers: [RulesController],
})
export class RulesModule {}
