import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import {
  appConfiguration,
  redisConfiguration,
  schemaValidation,
} from './configs';
import { StoresModule } from './stores/stores.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { GroupsModule } from './groups/groups.module';
import { StagesModule } from './stages/stages.module';
import { TeamsModule } from './teams/teams.module';
import { StageRewardModule } from './stage-reward/stage-reward.module';
import { MatchesModule } from './matches/matches.module';
import { GoogleSpreadsheetModule } from './google-spreadsheet/google-spreadsheet.module';
import { RedisModule } from './redis/redis.module';
import { CronModule } from './cron/cron.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GoogleSheetModule } from './google-sheet/google-sheet.module';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import pino, { TransportTargetOptions } from 'pino';
import { RulesModule } from './rules/rules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        // `${process.cwd()}/src/configs/env/.env.ds`,
        `${process.cwd()}/src/configs/env/.env.app`,
        `${process.cwd()}/src/configs/env/.env.redis`,
      ],
      load: [redisConfiguration, appConfiguration],
      validationSchema: schemaValidation,
      cache: true,
    }),
    PinoLoggerModule.forRootAsync({
      inject: [appConfiguration.KEY],
      useFactory: async (appConf: ConfigType<typeof appConfiguration>) => {
        return {
          pinoHttp: {
            logger: pino(
              {
                level: 'trace',
              },
              pino.transport({
                targets: [
                  ...(appConf.nodeEnv === 'development'
                    ? [
                        {
                          target: 'pino-pretty',
                          level: 'trace',
                          options: {
                            colorize: true,
                          },
                        } satisfies TransportTargetOptions,
                      ]
                    : []),

                  ...(appConf.loki.logLoki
                    ? [
                        {
                          target: 'pino-loki',
                          options: {
                            labels: {
                              application: appConf.metrics.metricsAppName,
                            },
                            batching: true,
                            interval: 5,
                            host: appConf.loki.logLokiUrl,
                          },
                        } satisfies TransportTargetOptions,
                      ]
                    : []),
                ],
              }),
            ),
          },
        };
      },
    }),
    ScheduleModule.forRoot(),
    StoresModule,
    CompetitionsModule,
    GroupsModule,
    StagesModule,
    TeamsModule,
    StageRewardModule,
    MatchesModule,
    GoogleSpreadsheetModule,
    RedisModule,
    CronModule,
    GoogleSheetModule,
    RulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
