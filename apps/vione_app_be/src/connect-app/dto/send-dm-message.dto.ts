import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendDmMessageDto {
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống' })
  @IsString({ message: 'Nội dung tin nhắn phải là chuỗi văn bản' })
  body!: string;

  @IsOptional()
  @IsString({ message: 'Mã clientToken phải là chuỗi' })
  clientToken?: string;

  @IsOptional()
  replyTo?: any;
}

export class ReactDmMessageDto {
  @IsNotEmpty({ message: 'Biểu tượng cảm xúc emoji không được để trống' })
  @IsString({ message: 'Emoji phải là chuỗi ký tự' })
  emoji!: string;
}
