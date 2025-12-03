//#region Imports
import { HttpStatus } from '@nestjs/common';
//#endregion

//#region Codes
export const ErrorCodes = {
  TASK_NOT_FOUND: {
    code: 'TASK_NOT_FOUND',
    message: 'Esta tarefa não foi encontrada.',
    status: HttpStatus.NOT_FOUND,
  },
  INVALID_PAYLOAD: {
    code: 'INVALID_PAYLOAD',
    message: 'Os dados enviados são inválidos.',
    status: HttpStatus.BAD_REQUEST,
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Erro ao acessar o banco de dados.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
//#endregion
