import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập email, số điện thoại hoặc tên đăng nhập"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  rememberMe: z.boolean().optional(),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không đúng định dạng"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  companyName: z.string().optional(),
  title: z.string().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
