import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Tài khoản / Email không được để trống' })
  @IsString({ message: 'Tài khoản / Email phải là chuỗi văn bản' })
  username!: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  password!: string;
}
