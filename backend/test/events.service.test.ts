import 'reflect-metadata';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, test } from 'bun:test';
import { EventsService } from '../src/events/events.service';
import type { IngestEventDto } from '../src/common/dto/ingest-event.dto';

function buildEvent(overrides: Partial<IngestEventDto> = {}): IngestEventDto {
  return {
    event_id: 'evt_123',
    event_type: 'purchase',
    timestamp: '2026-03-24T10:30:00Z',
    data: {
      product_id: 'prod_789',
      amount: 49.99,
      currency: 'USD',
    },
    ...overrides,
  };
}

describe('EventsService', () => {
  test('rejects a payload whose store_id does not match the authenticated store', async () => {
    let transactionCalls = 0;

    const service = new EventsService(
      { del: async () => undefined } as never,
      {
        withTransaction: async () => {
          transactionCalls += 1;
        },
      } as never,
      { insertEvent: async () => undefined } as never,
      { applyEvent: async () => undefined } as never,
    );

    await expect(
      service.ingest('store_1', buildEvent({ store_id: 'store_2' })),
    ).rejects.toThrow(BadRequestException);

    expect(transactionCalls).toBe(0);
  });

  test('does not apply rollups or invalidate cache when the insert conflicts', async () => {
    let rollupCalls = 0;
    let cacheInvalidations = 0;

    const service = new EventsService(
      {
        del: async () => {
          cacheInvalidations += 1;
        },
      } as never,
      {
        withTransaction: async (
          operation: (client: unknown) => Promise<unknown>,
        ) => operation({}),
      } as never,
      {
        insertEvent: async () => {
          throw new ConflictException('duplicate event');
        },
      } as never,
      {
        applyEvent: async () => {
          rollupCalls += 1;
        },
      } as never,
    );

    await expect(service.ingest('store_1', buildEvent())).rejects.toThrow(
      ConflictException,
    );

    expect(rollupCalls).toBe(0);
    expect(cacheInvalidations).toBe(0);
  });
});
