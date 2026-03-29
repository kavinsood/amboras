import { Module } from '@nestjs/common';
import { StoresRepository } from './stores.repository';
import { StoresService } from './stores.service';

@Module({
  providers: [StoresService, StoresRepository],
  exports: [StoresService, StoresRepository],
})
export class StoresModule {}
