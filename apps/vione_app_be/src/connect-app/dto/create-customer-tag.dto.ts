import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateCustomerTagDto {
  @IsNotEmpty({ message: 'Tên nhãn không được để trống' })
  @IsString({ message: 'Tên nhãn phải là chuỗi văn bản' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Mã màu hex phải là chuỗi (VD: #6366F1)' })
  colorHex?: string;

  @IsOptional()
  @IsString({ message: 'Danh mục nhãn phải là chuỗi' })
  category?: string;
}

export class RenameCustomerTagDto {
  @IsNotEmpty({ message: 'Tên nhãn mới không được để trống' })
  @IsString({ message: 'Tên nhãn phải là chuỗi văn bản' })
  name!: string;
}
