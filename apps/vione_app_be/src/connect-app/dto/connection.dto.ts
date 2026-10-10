import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export class SendConnectionRequestDto {
  @IsNotEmpty({ message: 'Mã đối tác (recipientId / targetUserId) không được để trống' })
  @IsString({ message: 'Mã đối tác phải là chuỗi' })
  targetUserId!: string;

  @IsOptional()
  @IsString({ message: 'Tin nhắn giới thiệu phải là chuỗi văn bản' })
  message?: string;
}

export class UpdateConnectionDto {
  @IsNotEmpty({ message: 'Trạng thái kết nối không được để trống' })
  @IsEnum(['accepted', 'declined', 'blocked'], { message: 'Trạng thái kết nối phải là accepted, declined hoặc blocked' })
  status!: 'accepted' | 'declined' | 'blocked';
}

export class ResolveCounterpartsDto {
  @IsArray({ message: 'Danh sách userIds phải là một mảng chuỗi' })
  userIds!: string[];
}
