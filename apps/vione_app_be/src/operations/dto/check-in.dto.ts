import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsNotEmpty({ message: 'Mã nhân viên không được để trống' })
  @IsString({ message: 'Mã nhân viên phải là chuỗi' })
  employeeId!: string;

  @IsNotEmpty({ message: 'Tên nhân viên không được để trống' })
  @IsString({ message: 'Tên nhân viên phải là chuỗi' })
  employeeName!: string;

  @IsNotEmpty({ message: 'Khoảng cách GPS không được để trống' })
  @IsNumber({}, { message: 'Khoảng cách phải là số mét' })
  distance!: number; // mét so với trụ sở (BR-HRM-01: <= 50m)

  @IsNotEmpty({ message: 'Điểm FaceID AI không được để trống' })
  @IsNumber({}, { message: 'Điểm FaceID phải là số %' })
  faceScore!: number; // % khớp AI FaceID (BR-HRM-02: >= 92%)

  @IsOptional()
  @IsNumber({}, { message: 'Vĩ độ GPS phải là số' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Kinh độ GPS phải là số' })
  longitude?: number;
}
