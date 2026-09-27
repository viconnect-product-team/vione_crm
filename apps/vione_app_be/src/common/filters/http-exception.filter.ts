import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin!',
  [HttpStatus.UNAUTHORIZED]: 'Phiên đăng nhập đã hết hạn hoặc thông tin đăng nhập không chính xác. Vui lòng đăng nhập lại!',
  [HttpStatus.FORBIDDEN]: 'Bạn không có quyền thực hiện thao tác này trên hệ thống ViOne Connect!',
  [HttpStatus.NOT_FOUND]: 'Không tìm thấy dữ liệu hoặc tài nguyên yêu cầu trên hệ thống.',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'Phương thức xử lý không được hỗ trợ.',
  [HttpStatus.CONFLICT]: 'Dữ liệu bị trùng lặp hoặc xung đột với trạng thái hiện tại của hệ thống.',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Dữ liệu không thể xử lý. Vui lòng kiểm tra định dạng dữ liệu!',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Máy chủ đang bận hoặc xảy ra lỗi xử lý nội bộ. Vui lòng thử lại sau ít phút!',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Hệ thống đang bận hoặc xảy ra lỗi không xác định. Vui lòng thử lại sau!';
    let errors: Record<string, string> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resObj = exception.getResponse();

      if (typeof resObj === 'string') {
        message = this.translateEnglishMessage(resObj, status);
      } else if (typeof resObj === 'object' && resObj !== null) {
        const anyRes = resObj as Record<string, any>;

        if (Array.isArray(anyRes.message)) {
          message = anyRes.message.join('; ');
          if (anyRes.errors) {
            errors = anyRes.errors;
          }
        } else if (typeof anyRes.message === 'string') {
          message = this.translateEnglishMessage(anyRes.message, status);
        } else {
          message = DEFAULT_ERROR_MESSAGES[status] || 'Đã xảy ra lỗi khi xử lý yêu cầu.';
        }

        if (anyRes.errors && !errors) {
          errors = anyRes.errors;
        }
      }
    } else if (exception instanceof Error) {
      console.error('[UnhandledException - ViOne]', exception.message, exception.stack);
      message = 'Đã xảy ra lỗi trong quá trình xử lý máy chủ. Vui lòng thử lại sau!';
    }

    response.status(status).json({
      statusCode: status,
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private translateEnglishMessage(raw: string, status: number): string {
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();

    if (lower === 'unauthorized' || lower.includes('invalid credentials')) {
      return 'Email đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!';
    }
    if (lower === 'bad request') {
      return DEFAULT_ERROR_MESSAGES[HttpStatus.BAD_REQUEST];
    }
    if (lower === 'forbidden' || lower.includes('forbidden resource')) {
      return DEFAULT_ERROR_MESSAGES[HttpStatus.FORBIDDEN];
    }
    if (lower === 'not found' || lower.includes('cannot get') || lower.includes('cannot post')) {
      return DEFAULT_ERROR_MESSAGES[HttpStatus.NOT_FOUND];
    }
    if (lower.includes('username already exists') || lower.includes('user already exists')) {
      return 'Tên đăng nhập hoặc địa chỉ email này đã tồn tại trên hệ thống ViOne. Vui lòng sử dụng thông tin khác!';
    }
    if (lower.includes('jwt expired') || lower.includes('token expired')) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục!';
    }
    if (lower.includes('invalid token') || lower.includes('malformed')) {
      return 'Mã xác thực không hợp lệ. Vui lòng đăng nhập lại!';
    }

    return trimmed;
  }
}
