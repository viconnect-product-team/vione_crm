import { IsOptional, IsString, IsArray, IsInt, Min } from 'class-validator';

export class PrepareMomentDto {
  @IsOptional()
  @IsString()
  personId?: string;

  @IsOptional()
  @IsString()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsString()
  placeLabel?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  photoCount?: number;

  @IsOptional()
  @IsArray()
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  clientToken?: string;

  @IsOptional()
  @IsString()
  visibility?: 'public' | 'friends' | 'private';
}

export class FinalizeMomentDto {
  @IsOptional()
  @IsString()
  momentId?: string;

  @IsOptional()
  @IsArray()
  photos?: any[];

  @IsOptional()
  @IsArray()
  photoUrls?: string[];

  @IsOptional()
  @IsArray()
  taggedUserIds?: string[];
}

export class UpdateMomentDto {
  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsString()
  placeLabel?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  visibility?: string;
}

export class NotifyMomentTagsDto {
  @IsString()
  momentId: string;

  @IsArray()
  taggedUserIds: string[];

  @IsOptional()
  @IsString()
  content?: string;
}
