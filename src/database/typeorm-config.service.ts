// import * as path from 'path';
// import { Inject, Injectable } from '@nestjs/common';
// import { ConfigType } from '@nestjs/config';
// // import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
// // import { dsConfiguration } from '../configs';

// @Injectable()
// export class TypeOrmConfigService implements TypeOrmOptionsFactory {
//   constructor(
//     // @Inject(dsConfiguration.KEY)
//     // private dsConfig: ConfigType<typeof dsConfiguration>,
//   ) {}

//   createTypeOrmOptions(): TypeOrmModuleOptions {
//     return {
//       type: 'postgres',
//       host: this.dsConfig.host,
//       port: +this.dsConfig.port,
//       username: this.dsConfig.username,
//       password: this.dsConfig.password,
//       database: this.dsConfig.database,
//       //   url: this.dsConfig.url,
//       entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
//       // autoLoadEntities: true,
//       synchronize: this.dsConfig.synchronize,
//       logging: process.env.NODE_ENV !== 'production',
//       // retryAttempts: 10,
//       // retryDelay: 3000,
//       migrationsRun: process.env.NODE_ENV === 'production',
//       migrations: [
//         path.join(__dirname, '/migrations/*{.ts,.js}'),
//         path.join(__dirname, '/seeds/*{.ts,.js}'),
//       ],
//       migrationsTableName: '__migrations',
//       // dropSchema: false,
//       // keepConnectionAlive: true,
//       // seeds: [path.join(__dirname, '/seeds/**/*{.ts,.js}')],
//       // factories: [path.join(__dirname, '/factories/**/*{.ts,.js}')],
//       // cli: {
//       //   // entitiesDir: 'src',
//       //   migrationsDir: 'src/database/migrations',
//       //   subscribersDir: 'subscriber',
//       // },
//       // extra: {
//       //   // based on https://node-postgres.com/api/pool
//       //   // max connection pool size
//       //   max: this.configService.get('ds.maxConnections'),
//       //   ssl: this.configService.get('ds.sslEnabled')
//       //     ? {
//       //         rejectUnauthorized: this.configService.get(
//       //           'ds.rejectUnauthorized',
//       //         ),
//       //         ca: this.configService.get('ds.ca')
//       //           ? this.configService.get('ds.ca')
//       //           : undefined,
//       //         key: this.configService.get('ds.key')
//       //           ? this.configService.get('ds.key')
//       //           : undefined,
//       //         cert: this.configService.get('ds.cert')
//       //           ? this.configService.get('ds.cert')
//       //           : undefined,
//       //       }
//       //     : undefined,
//       // },
//     };
//   }

//   createTypeOrmMigrationOption(): TypeOrmModuleOptions {
//     return {
//       ...this.createTypeOrmOptions(),
//       migrations: [path.join(__dirname, '/migrations/**/*{.ts,.js}')],
//       migrationsTableName: '__migrations',
//       logging: true,
//       synchronize: false,
//     };
//   }

//   createTypeOrmSeedOption(): TypeOrmModuleOptions {
//     return {
//       ...this.createTypeOrmOptions(),
//       migrations: [path.join(__dirname, '/seeds/**/*{.ts,.js}')],
//       migrationsTableName: '__seeders',
//       logging: true,
//       synchronize: false,
//     };
//   }
// }
