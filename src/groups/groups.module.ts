import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { RedisModule } from '../redis/redis.module';
import { StagesModule } from '../stages/stages.module';

@Module({
  imports: [RedisModule, StagesModule],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
