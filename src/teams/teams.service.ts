import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TeamsService {
  constructor(private readonly redisService: RedisService) {}

  logger = new Logger(TeamsService.name);
}
