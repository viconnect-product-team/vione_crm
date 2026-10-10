import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class CreateLeaveDto {
  @IsNotEmpty({ message: 'Tên nhân viên không được để trống' })
  @IsString({ message: 'Tên nhân viên phải là chuỗi' })
  employeeName!: string;

  @IsNotEmpty({ message: 'Loại nghỉ phép không được để trống' })
  @IsEnum(['phep_nam', 'ot', 'viec_rieng'], { message: 'Loại nghỉ phép phải là phep_nam, ot hoặc viec_rieng' })
  type!: string;

  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsString({ message: 'Ngày bắt đầu phải là chuỗi ngày tháng' })
  startDate!: string;

  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsString({ message: 'Ngày kết thúc phải là chuỗi ngày tháng' })
  endDate!: string;

  @IsNotEmpty({ message: 'Lý do nghỉ phép không được để trống' })
  @IsString({ message: 'Lý do phải là chuỗi văn bản' })
  reason!: string;
}
