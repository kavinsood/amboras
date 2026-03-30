import { describe, expect, test } from 'bun:test';
import { HttpException, HttpStatus } from '@nestjs/common';
import { EventsRateLimitGuard } from '../src/events/events-rate-limit.guard';

function createContext(ip: string, forwardedFor?: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        ip,
        headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
      }),
    }),
  } as never;
}

describe('EventsRateLimitGuard', () => {
  test('allows the first 100 requests within the same window and blocks the 101st', () => {
    const guard = new EventsRateLimitGuard();
    const context = createContext('127.0.0.1');

    for (let index = 0; index < 100; index += 1) {
      expect(guard.canActivate(context)).toBe(true);
    }

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(() => guard.canActivate(context)).toThrow(/Too many event ingestion requests/);
  });

  test('uses x-forwarded-for when available', () => {
    const guard = new EventsRateLimitGuard();

    for (let index = 0; index < 100; index += 1) {
      expect(guard.canActivate(createContext('127.0.0.1', '203.0.113.42'))).toBe(true);
    }

    let thrownError: unknown;
    try {
      guard.canActivate(createContext('127.0.0.1', '203.0.113.42'));
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(HttpException);
    expect((thrownError as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
  });
});
