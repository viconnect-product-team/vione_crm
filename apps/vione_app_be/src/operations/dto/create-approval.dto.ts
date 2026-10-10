import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateApprovalDto {
  @IsNotEmpty({ message: 'Tiêu đề đề xuất không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi văn bản' })
  title!: string;

  @IsNotEmpty({ message: 'Số tiền thanh toán không được để trống' })
  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(0, { message: 'Số tiền phải lớn hơn hoặc bằng 0' })
  amount!: number;

  @IsNotEmpty({ message: 'Người thụ hưởng không được để trống' })
  @IsString({ message: 'Người thụ hưởng phải là chuỗi văn bản' })
  recipient!: string;

  @IsOptional()
  @IsString({ message: 'Phòng ban phải là chuỗi văn bản' })
  department?: string;

  @IsOptional()
  @IsString({ message: 'Tên ngân hàng phải là chuỗi văn bản' })
  bankName?: string;

  @IsOptional()
  @IsString({ message: 'Số tài khoản phải là chuỗi văn bản' })
  accountNumber?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả chi tiết phải là chuỗi văn bản' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Số hóa đơn chứng từ phải là chuỗi văn bản' })
  invoiceNumber?: string;
}
