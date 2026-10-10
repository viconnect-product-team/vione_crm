import { IsOptional, IsString, IsArray } from 'class-validator';

export class OptimizeScheduleDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsArray()
  preferences?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
