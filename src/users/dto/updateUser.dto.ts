//#region Imports
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './createUser.dto';
//#endregion

//#region DTO
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const),
) {}
//#endregion
