import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateCustomerNeedDto {
  @IsOptional()
  @IsString({ message: 'Phân loại nhu cầu phải là chuỗi' })
  kind?: string;

  @IsNotEmpty({ message: 'Nội dung nhu cầu không được để trống' })
  @IsString({ message: 'Nội dung nhu cầu phải là chuỗi văn bản' })
  body!: string;

  @IsOptional()
  @IsEnum(['open', 'in_progress', 'fulfilled', 'cancelled'], { message: 'Trạng thái nhu cầu không hợp lệ' })
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'], { message: 'Độ ưu tiên không hợp lệ' })
  priority?: string;
}

export class UpdateCustomerNeedDto {
  @IsOptional()
  @IsString({ message: 'Phân loại nhu cầu phải là chuỗi' })
  kind?: string;

  @IsOptional()
  @IsString({ message: 'Nội dung nhu cầu phải là chuỗi văn bản' })
  body?: string;

  @IsOptional()
  @IsEnum(['open', 'in_progress', 'fulfilled', 'cancelled'], { message: 'Trạng thái nhu cầu không hợp lệ' })
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'], { message: 'Độ ưu tiên không hợp lệ' })
  priority?: string;
}
