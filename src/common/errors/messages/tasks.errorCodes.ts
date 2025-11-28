import { HttpStatus } from '@nestjs/common';

export const ErrorCodes = {
  TASK_NOT_FOUND: {
    code: 'TASK_NOT_FOUND',
    message: 'Esta tarefa não foi encontrada.',
    status: HttpStatus.NOT_FOUND,
  },
};
