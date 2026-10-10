import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateOpportunityDto {
  @IsNotEmpty({ message: 'Tiêu đề cơ hội kinh doanh không được để trống' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  expectedValue?: string | number;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  closingDate?: string;
}

export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  expectedValue?: string | number;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  closingDate?: string;
}

export class ExpressOpportunityInterestDto {
  @IsOptional()
  @IsIn(['high', 'low'], { message: 'Mức độ quan tâm phải là "high" hoặc "low"' })
  interestLevel?: 'high' | 'low';

  @IsOptional()
  @IsString()
  message?: string;
}

export class ExpressOpportunityInterestGlobalDto {
  @IsNotEmpty({ message: 'Mã cơ hội kinh doanh không được để trống' })
  @IsString()
  opportunityId: string;

  @IsOptional()
  @IsString()
  message?: string;
}

