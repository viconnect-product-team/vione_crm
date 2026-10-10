import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class VietnameseValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToInstance(metadata.metatype, value);
    const errors: ValidationError[] = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors && errors.length > 0) {
      const messages: string[] = [];
      const errorMap: Record<string, string> = {};

      for (const err of errors) {
        if (err.constraints) {
          const first = Object.keys(err.constraints)[0];
          let msg = `Trường ${err.property} không hợp lệ.`;
          switch (first) {
            case 'isNotEmpty':
              msg = `Vui lòng nhập đầy đủ thông tin: "${err.property}". Không được để trống.`;
              break;
            case 'isEmail':
              msg = `Định dạng email "${err.property}" không hợp lệ (Ví dụ: user@example.com).`;
              break;
            case 'minLength':
              msg = `Trường "${err.property}" quá ngắn. Vui lòng nhập tối thiểu theo yêu cầu.`;
              break;
            case 'maxLength':
              msg = `Trường "${err.property}" vượt quá độ dài tối đa cho phép.`;
              break;
            case 'isNumber':
            case 'isNumberString':
              msg = `Trường "${err.property}" phải là định dạng số hợp lệ.`;
              break;
            case 'isPositive':
              msg = `Giá trị của "${err.property}" phải là số dương lớn hơn 0.`;
              break;
            default:
              msg = err.constraints[first] || msg;
              break;
          }
          messages.push(msg);
          errorMap[err.property] = msg;
        }
      }

      throw new BadRequestException({
        statusCode: 400,
        message: messages.join('; ') || 'Dữ liệu gửi lên không đúng định dạng yêu cầu!',
        errors: errorMap,
      });
    }

    return object;
  }


  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

export function createVietnameseValidationPipe(): PipeTransform {
  return new VietnameseValidationPipe();
}
