import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { filterNull } from '../utils/filter-null-data';

@Injectable()
export class RulesService {
  constructor(private readonly redisService: RedisService) {}

  private readonly logger = new Logger(RulesService.name);

  async getRules() {
    try {
      let data = await this.redisService.get('rules');
      data = filterNull(data);

      if (!data) {
        return [];
      }

      const dataWithoutHeader = [...data.slice(1)];

      return dataWithoutHeader.flat();
    } catch (error) {
      this.logger.error(`Error while get rule data, ${error}`);

      throw new InternalServerErrorException();
    }
  }
}
