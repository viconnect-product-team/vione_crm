import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export class CreateExecutiveTaskDto {
  @IsNotEmpty({ message: 'Tiêu đề công việc lãnh đạo không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi văn bản' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Người phụ trách phải là chuỗi văn bản' })
  assignee?: string;

  @IsOptional()
  @IsString({ message: 'Thời hạn phải là chuỗi ngày tháng' })
  deadline?: string;

  @IsOptional()
  @IsString({ message: 'Phòng ban phải là chuỗi văn bản' })
  department?: string;

  @IsOptional()
  @IsEnum(['urgent', 'high', 'medium', 'low'], { message: 'Độ ưu tiên không hợp lệ' })
  priority?: 'urgent' | 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi văn bản' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Thời gian nhắc trước phải là số phút' })
  @Min(0, { message: 'Số phút nhắc trước phải lớn hơn hoặc bằng 0' })
  remindMinutesBefore?: number;

  @IsOptional()
  @IsString({ message: 'Khung giờ phải là chuỗi văn bản' })
  timeSlot?: string;

  @IsOptional()
  @IsEnum(['meeting', 'task', 'approval', 'personal'], { message: 'Phân loại công việc không hợp lệ' })
  category?: 'meeting' | 'task' | 'approval' | 'personal';

  @IsOptional()
  @IsEnum(['urgent_important', 'important_not_urgent', 'urgent_not_important', 'neither'], {
    message: 'Ma trận Eisenhower không hợp lệ',
  })
  quadrant?: 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'neither';
}
