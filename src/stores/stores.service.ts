import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { filterNull } from '../utils/filter-null-data';

export type storeType = {
  code: string;
  am: string | null;
  ssh: string | null;
  sh: string | null;
  imageUrl: string | null;
};

@Injectable()
export class StoresService {
  constructor(private readonly redisService: RedisService) {}

  logger = new Logger(StoresService.name);

  async listStoreRedis() {
    try {
      const data = (await this.redisService.get('store')) as Array<
        Array<string>
      >;

      if (!data) {
        return [];
      }

      const filteredData = filterNull(data);

      const stores: storeType[] = [];

      // remove header
      const dataWithoutHeader = [...filteredData.slice(1)];

      for (const d of dataWithoutHeader) {
        stores.push({
          code: d[0],
          am: d[1] || null,
          ssh: d[2] || null,
          sh: d[3] || null,
          imageUrl: d[4] || null,
        });
      }

      return stores;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
