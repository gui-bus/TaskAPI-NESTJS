import { HttpStatus } from '@nestjs/common';

export const TasksErrorCodes = {
  TASK_NOT_FOUND: {
    code: 'TASK_NOT_FOUND',
    message: 'Esta tarefa não foi encontrada.',
    status: HttpStatus.NOT_FOUND,
  },
  TASK_CREATE_FAILED: {
    code: 'TASK_CREATE_FAILED',
    message: 'Falha ao criar a tarefa.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  TASK_UPDATE_FAILED: {
    code: 'TASK_UPDATE_FAILED',
    message: 'Falha ao atualizar a tarefa.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  TASK_DELETE_FAILED: {
    code: 'TASK_DELETE_FAILED',
    message: 'Falha ao excluir a tarefa.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
