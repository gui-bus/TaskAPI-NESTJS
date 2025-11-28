import { HttpException, HttpStatus } from '@nestjs/common';

interface AppErrorParams {
  message: string;
  code: string;
  status: HttpStatus;
}

export class AppError extends HttpException {
  constructor(params: AppErrorParams) {
    super(
      {
        status: params.status,
        message: params.message,
        code: params.code,
      },
      params.status,
    );
  }
}
