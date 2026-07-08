import { HttpStatus } from '@nestjs/common';

export const UsersErrorCodes = {
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'Este usuário não foi encontrado.',
    status: HttpStatus.NOT_FOUND,
  },
  USER_UPDATE_FAILED: {
    code: 'USER_UPDATE_FAILED',
    message: 'Falha ao atualizar o usuário.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USER_DELETE_FAILED: {
    code: 'USER_DELETE_FAILED',
    message: 'Falha ao excluir o usuário.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  USER_CREATE_FAILED: {
    code: 'USER_CREATE_FAILED',
    message: 'Falha ao criar o usuário.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
