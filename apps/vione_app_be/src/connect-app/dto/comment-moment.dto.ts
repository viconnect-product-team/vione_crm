import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateMomentCommentDto {
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  mentions?: any[];
}
