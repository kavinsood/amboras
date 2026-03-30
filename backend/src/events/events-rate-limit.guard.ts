import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

type RateLimitBucket = {
  count: number;
  windowStartsAt: number;
};

@Injectable()
export class EventsRateLimitGuard implements CanActivate {
  private readonly limit = 100;
  private readonly windowMs = 10_000;
  private readonly buckets = new Map<string, RateLimitBucket>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, unknown>;
    }>();
    const bucketKey = this.getBucketKey(request);
    const now = Date.now();
    this.pruneExpiredBuckets(now);
    const bucket = this.buckets.get(bucketKey);

    if (!bucket || now - bucket.windowStartsAt >= this.windowMs) {
      this.buckets.set(bucketKey, {
        count: 1,
        windowStartsAt: now,
      });
      return true;
    }

    if (bucket.count >= this.limit) {
      throw new HttpException(
        'Too many event ingestion requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private getBucketKey(request: { ip?: string; headers?: Record<string, unknown> }) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim() ?? request.ip ?? 'unknown';
    }

    return request.ip ?? 'unknown';
  }

  private pruneExpiredBuckets(now: number) {
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.windowStartsAt >= this.windowMs) {
        this.buckets.delete(key);
      }
    }
  }
}
