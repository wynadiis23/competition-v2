import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { filterNull } from '../utils/filter-null-data';

@Injectable()
export class GroupsService {
  constructor(private readonly redisService: RedisService) {}

  logger = new Logger(GroupsService.name);

  async listGroupRedis(competition: string, stage: string) {
    try {
      const data = (await this.redisService.get('competition')) as Array<
        Array<string>
      >;

      if (!data) {
        this.logger.error(`Competition data is NULL in listGroupRedis`);
        return [];
      }

      const filteredData = filterNull(data);

      const id = `${competition}_${stage}`; // id
      const groups: string[] = [];
      let groupCount: number;

      const dataWithoutHeader = [...filteredData.slice(1)]; // remove header

      // take group count to make group
      // group count at index 7

      for (const d of dataWithoutHeader) {
        if (d[0] === id) {
          if (d[7]) {
            groupCount = +d[7];
          }
        }
      }

      for (let i = 1; i <= groupCount; i++) {
        groups.push(`Group_${i}_Store`);
      }

      return groups;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async dayOfMatches(competition: string, stage: string) {
    try {
      const groups = await this.listGroupRedis(competition, stage);

      if (!groups.length) {
        return [];
      }

      const busDate: string[] = [];

      for (const group of groups) {
        const matchesResultId = `Matchup-${competition}-${stage}-${group}`;
        const data = (await this.redisService.get(matchesResultId)) as Array<
          Array<string>
        >;

        if (!data) {
          return [];
        }

        const filteredData = filterNull(data);

        // remove header
        const dataWithoutHeader = [...filteredData.slice(1)];

        // get list of bus date
        // bus date at index 2

        for (const d of dataWithoutHeader) {
          busDate.push(d[2]);
        }
      }
      // filter null values
      const validBusDate = busDate.filter((date) => date);

      if (!validBusDate.length) {
        // no business date was set in matchup sheet
        return {
          startDate: '',
          endDate: '',
        };
      }

      const uniqueDayOfMatches = new Set<string>(validBusDate);

      type dateObjTyp = { dateString: string; date: Date };

      const arrDateObj: dateObjTyp[] = [];
      for (const day of uniqueDayOfMatches) {
        const dateObj: dateObjTyp = {
          date: new Date(day),
          dateString: day,
        };

        arrDateObj.push(dateObj);
      }
      const validDateObj = arrDateObj.filter(
        (date) => !isNaN(date.date.valueOf()),
      );

      if (validDateObj.length === 1) {
        return {
          startDate: validDateObj[0].dateString,
          endDate: validDateObj[0].dateString,
        };
      }

      validDateObj.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        startDate: validDateObj[0].dateString,
        endDate: validDateObj[validDateObj.length - 1].dateString,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
