import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { filterNull } from '../utils/filter-null-data';

type stageType = {
  id: string;
  name: string;
};

@Injectable()
export class StagesService {
  constructor(private readonly redisService: RedisService) {}

  logger = new Logger(StagesService.name);

  async listStageRedis(competition: string) {
    try {
      const data = (await this.redisService.get('competition')) as Array<
        Array<string>
      >;

      if (!data) {
        return [];
      }

      const filteredData = filterNull(data);

      // stage title in index 2
      const dataWithoutHeader = [...filteredData.slice(1)]; // remove header

      const stages: stageType[] = [];

      for (const d of dataWithoutHeader) {
        if (d[1] === competition) {
          if (d[2]) {
            stages.push({
              id: d[2],
              name: d[17],
            }); // stage in index 2 and description stage in index 17
          }
        }
      }

      return stages;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
