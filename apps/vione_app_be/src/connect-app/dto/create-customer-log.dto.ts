import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCustomerLogDto {
  @IsOptional()
  @IsString({ message: 'Loại nhật ký phải là chuỗi (note, call, meeting, quote, message)' })
  kind?: string;

  @IsNotEmpty({ message: 'Nội dung nhật ký không được để trống' })
  @IsString({ message: 'Nội dung nhật ký phải là chuỗi văn bản' })
  body!: string;

  @IsOptional()
  @IsString({ message: 'Thời điểm xảy ra phải là chuỗi ISO ngày tháng' })
  occurredAt?: string;
}
