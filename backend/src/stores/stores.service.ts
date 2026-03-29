import { Injectable } from '@nestjs/common';
import { StoresRepository } from './stores.repository';

@Injectable()
export class StoresService {
  constructor(private readonly storesRepository: StoresRepository) {}

  findStoreById(storeId: string) {
    return this.storesRepository.findStoreById(storeId);
  }
}
