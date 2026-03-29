import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const analyticsRanges = ['today', 'week', 'month'] as const;
export type AnalyticsRange = (typeof analyticsRanges)[number];

export class AnalyticsQueryDto {
  @IsOptional()
  @IsIn(analyticsRanges)
  @Transform(({ value }) => value ?? 'month')
  range: AnalyticsRange = 'month';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(30)
  days = 14;
}
