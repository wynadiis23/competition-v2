import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { filterNull } from '../utils/filter-null-data';

@Injectable()
export class GoogleSheetService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  logger = new Logger(GoogleSheetService.name);

  async pullGoogleSheetData() {
    try {
      let data: any[] = [];
      const GOOGLE_SHEET_ID = this.configService.get<string>('GOOGLE_SHEET_ID');
      const API_KEY_PROJECT = this.configService.get<string>('API_KEY_PROJECT');

      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}?`,
        params: {
          key: API_KEY_PROJECT,
          includeGridData: true,
        },
        headers: {},
      };

      this.logger.log('Trying to pull data from google sheet');
      data = await axios.request(config).then((response) => response.data);

      const sheets = {};
      let title: string;

      for (const st of data['sheets']) {
        title = st['properties']['title'];

        // skip sheet title that starts with _
        if (!title.startsWith('_')) {
          for (const metadata of st['data']) {
            const rows = [];
            for (const rowData of metadata['rowData']) {
              const row = [];
              for (const colMetadata of rowData['values']) {
                const z = colMetadata.hasOwnProperty('formattedValue')
                  ? colMetadata['formattedValue']
                  : null;

                row.push(z);
              }

              rows.push(row);
            }

            sheets[title] = rows;
          }
        }
      }

      return sheets;
    } catch (error) {
      this.logger.error(`Error while pull google sheet axios ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async getData() {
    try {
      const sheet = await this.pullGoogleSheetData();

      const configData = await this.getConfigGSheet(sheet);
      const competitionData = await this.getCompetitionData(sheet);
      const storeData = await this.getMasterStoreData(sheet);
      const matchupData = await this.getResultStageGroup(sheet);

      // filter row that contain all null value
      const filteredCompetitionData = filterNull(competitionData);
      const filteredConfigData = filterNull(configData);
      const filteredStoreData = filterNull(storeData);

      this.logger.log('Finished get data from sheet');

      // clear redis data
      await this.redisService.clearAll([]);

      // set newest data to redis
      await this.redisService.set('competition', filteredCompetitionData);
      await this.redisService.set('config', filteredConfigData);
      await this.redisService.set('store', filteredStoreData);

      let filteredMatchupData: any;
      for (const data of matchupData) {
        filteredMatchupData = filterNull(data.values);

        await this.redisService.set(data.id, filteredMatchupData);
      }

      this.logger.log('Finished insert new data from google sheet');

      return {
        message: 'Finished get data from sheet',
      };
    } catch (error) {
      this.logger.error(`Error while get data google sheet ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async getConfigGSheet(doc: any) {
    try {
      this.logger.log(`Trying to get config google sheet`);

      const sheet = doc['Config'];

      const values: Array<Array<string>> = [];

      for (const row of sheet) {
        values.push(row);
      }

      // value sales update data at index 5 then at index 1
      const salesUpdateTime = values[5][1];

      if (!salesUpdateTime) {
        this.logger.error(`Sales update time is null in config sheet.`);

        throw new InternalServerErrorException();
      }

      return values;
    } catch (error) {
      this.logger.error(`Error while get config google sheet ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async getCompetitionData(doc: any) {
    try {
      this.logger.log('Trying to get Competition Data');

      const sheet = doc['Competition'];

      const values: Array<Array<string>> = [];

      for (const row of sheet) {
        values.push(row);
      }

      return values;
    } catch (error) {
      this.logger.error(`Error when get Competition data ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async getMasterStoreData(doc: any) {
    try {
      this.logger.log('Trying to get Store Data');

      const sheet = doc['MasterStore'];

      const values: Array<Array<string>> = [];

      for (const row of sheet) {
        values.push(row);
      }

      return values;
    } catch (error) {
      this.logger.error(`Error when get Master Store data ${error}`);
      throw new InternalServerErrorException();
    }
  }

  async getResultStageGroup(doc: any) {
    try {
      const values: {
        id: string;
        values: any[];
      }[] = [];
      let competitionStageGroupId: string[] = [];

      const prefixResult = 'Matchup';
      const sheetTitles = Object.keys(doc);

      competitionStageGroupId = await Promise.all(
        sheetTitles.filter((s) => s.startsWith(prefixResult)),
      );

      const batchSize = 1; // Adjust as needed
      for (let i = 0; i < competitionStageGroupId.length; i += batchSize) {
        const batch = competitionStageGroupId.slice(i, i + batchSize);
        const sheetDataPromises = batch.map(async (id) => {
          this.logger.log(`Trying to get Matchup Data for ${id}`);

          const sheet = doc[id];
          const header = sheet[0];

          // remove header
          sheet.shift();
          const values = [header, ...sheet];
          return { id, values };
        });

        const sheetData = await Promise.all(sheetDataPromises);

        values.push(...sheetData);
      }

      return values;
    } catch (error) {
      this.logger.error(`Error when get Matchup data ${error}`);
      throw new InternalServerErrorException();
    }
  }
}
