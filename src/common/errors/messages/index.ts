import { CommonErrorCodes } from './common.errorCodes';
import { AuthErrorCodes } from './auth.errorCodes';
import { UsersErrorCodes } from './users.errorCodes';
import { TasksErrorCodes } from './tasks.errorCodes';

export const ErrorCodes = {
  ...CommonErrorCodes,
  ...AuthErrorCodes,
  ...UsersErrorCodes,
  ...TasksErrorCodes,
};
