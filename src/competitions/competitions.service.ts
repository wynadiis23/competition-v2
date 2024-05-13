import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { filterNull } from '../utils/filter-null-data';

@Injectable()
export class CompetitionsService {
  constructor(private readonly redisService: RedisService) {}

  async listCompetitionRedis() {
    try {
      const data = (await this.redisService.get('competition')) as Array<
        Array<string>
      >;

      if (!data) {
        return [];
      }

      const filteredData = filterNull(data);

      // hard coded competition title in index 1
      const dataWithoutHeader = [...filteredData.slice(1)]; // remove header index 0

      const competitions: string[] = [];

      for (const d of dataWithoutHeader) {
        competitions.push(d[1]); // competition title at index 1
      }

      const removedNullCompetition = competitions.filter((data) => data);

      return new Set<string>(removedNullCompetition);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
