import { HttpStatus } from '@nestjs/common';

export const AuthErrorCodes = {
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
};
