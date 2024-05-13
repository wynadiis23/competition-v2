import { Controller, Get } from '@nestjs/common';
import { StoresService } from './stores.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}
  @Get('/list/store')
  async listStoreRedis() {
    return await this.storesService.listStoreRedis();
  }
}
