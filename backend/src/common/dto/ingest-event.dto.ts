import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export const eventTypes = [
  'page_view',
  'add_to_cart',
  'remove_from_cart',
  'checkout_started',
  'purchase',
] as const;

export type EventType = (typeof eventTypes)[number];

export class IngestEventDataDto {
  @IsOptional()
  @IsString()
  product_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}

export class IngestEventDto {
  @IsString()
  @Length(3, 128)
  event_id!: string;

  @IsOptional()
  @IsString()
  @Length(3, 128)
  store_id?: string;

  @IsIn(eventTypes)
  event_type!: EventType;

  @IsISO8601()
  timestamp!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => IngestEventDataDto)
  data!: IngestEventDataDto;
}
