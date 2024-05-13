import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { RedisModule } from '../redis/redis.module';
import { StoresModule } from '../stores/stores.module';
import { GroupsModule } from '../groups/groups.module';
import { StagesModule } from '../stages/stages.module';

@Module({
  imports: [RedisModule, StoresModule, GroupsModule, StagesModule],
  providers: [MatchesService],
  controllers: [MatchesController],
})
export class MatchesModule {}
