//#region Imports
import { HttpStatus } from '@nestjs/common';
//#endregion

//#region Codes
export const ErrorCodes = {
  //#region NOT FOUND
  TASK_NOT_FOUND: {
    code: 'TASK_NOT_FOUND',
    message: 'Esta tarefa não foi encontrada.',
    status: HttpStatus.NOT_FOUND,
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'Este usuário não foi encontrado.',
    status: HttpStatus.NOT_FOUND,
  },
  //#endregion
  //#region PAYLOAD
  INVALID_PAYLOAD: {
    code: 'INVALID_PAYLOAD',
    message: 'Os dados enviados são inválidos.',
    status: HttpStatus.BAD_REQUEST,
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Credenciais inválidas.',
    status: HttpStatus.UNAUTHORIZED,
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Token inválido ou não encontrado.',
    status: HttpStatus.UNAUTHORIZED,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Acesso não autorizado.',
    status: HttpStatus.UNAUTHORIZED,
  },
  //#endregion
  //#region DATABASE
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Erro ao acessar o banco de dados.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  //#endregion
  //#region SERVER
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  //#endregion
};
//#endregion
