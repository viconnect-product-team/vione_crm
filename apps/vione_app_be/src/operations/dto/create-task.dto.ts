import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'Tiêu đề công việc không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi văn bản' })
  title!: string;

  @IsNotEmpty({ message: 'Người phụ trách không được để trống' })
  @IsString({ message: 'Người phụ trách phải là chuỗi văn bản' })
  assignee!: string;

  @IsNotEmpty({ message: 'Thời hạn hoàn thành không được để trống' })
  @IsString({ message: 'Thời hạn phải là chuỗi ngày tháng hợp lệ' })
  deadline!: string;

  @IsOptional()
  @IsString({ message: 'Phòng ban phải là chuỗi văn bản' })
  department?: string;

  @IsOptional()
  @IsEnum(['high', 'medium', 'low'], { message: 'Độ ưu tiên phải là high, medium hoặc low' })
  priority?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi văn bản' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách công việc con phải là một mảng' })
  checklist?: { id: string; text: string; done: boolean }[];
}
