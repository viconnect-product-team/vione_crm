import { IsOptional, IsString, IsEnum, IsNumber, IsArray, Min, Max } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'review', 'done'], { message: 'Trạng thái công việc không hợp lệ' })
  status?: 'todo' | 'in_progress' | 'review' | 'done';

  @IsOptional()
  @IsNumber({}, { message: 'Tiến độ hoàn thành phải là số' })
  @Min(0, { message: 'Tiến độ tối thiểu là 0%' })
  @Max(100, { message: 'Tiến độ tối đa là 100%' })
  progress?: number;

  @IsOptional()
  @IsArray({ message: 'Danh sách công việc con phải là một mảng' })
  checklist?: { id: string; text: string; done: boolean }[];

  @IsOptional()
  @IsString({ message: 'Người phụ trách phải là chuỗi văn bản' })
  assignee?: string;

  @IsOptional()
  @IsString({ message: 'Thời hạn phải là chuỗi ngày tháng' })
  deadline?: string;

  @IsOptional()
  @IsEnum(['high', 'medium', 'low'], { message: 'Độ ưu tiên phải là high, medium hoặc low' })
  priority?: 'high' | 'medium' | 'low';
}
