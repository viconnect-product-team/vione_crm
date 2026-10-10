import { IsOptional, IsString, IsEmail, IsArray } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString({ message: 'Tên khách hàng phải là chuỗi' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Công ty phải là chuỗi' })
  companyName?: string;

  @IsOptional()
  @IsString({ message: 'Chức danh phải là chuỗi' })
  jobTitle?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;

  @IsOptional()
  @IsString({ message: 'Giai đoạn phải là chuỗi' })
  stage?: string;

  @IsOptional()
  @IsArray({ message: 'Nhãn phải là danh sách chuỗi' })
  tags?: string[];
}
