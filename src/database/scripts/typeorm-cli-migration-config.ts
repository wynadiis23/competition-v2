// import * as fs from 'fs';
// // import { dsConfiguration, dataSourceValidation } from '../../configs';
// import { ConfigModule } from '@nestjs/config';
// import { Module } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// // import { TypeOrmConfigService } from '../typeorm-config.service';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       load: [dsConfiguration],
//       envFilePath: `${process.cwd()}/src/configs/env/.env.ds`,
//       validationSchema: dataSourceValidation,
//     }),
//   ],
//   providers: [TypeOrmConfigService],
// })
// class AppModule {}

// const setConfig = async () => {
//   const app = await NestFactory.create(AppModule);
//   const typeOrmServiceConfig = app.get(TypeOrmConfigService);
//   fs.writeFileSync(
//     'ormconfig-migration.ts',
//     `import { DataSource } from 'typeorm'; const config = new DataSource( ${JSON.stringify(
//       typeOrmServiceConfig.createTypeOrmMigrationOption(),
//       null,
//       2,
//     )} ); export default config;`,
//   );
//   await app.close();
// };

// void setConfig();
