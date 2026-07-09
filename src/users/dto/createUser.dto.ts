//#region Imports
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
//#endregion

import { ApiProperty } from '@nestjs/swagger';

//#region DTO
export class CreateUserDto {
  @ApiProperty({
    description: 'Primeiro nome do usuário.',
    example: 'John',
  })
  @IsString({ message: 'O nome deve ser um texto' })
  @MinLength(1, {
    message: 'O nome deve conter pelo menos 1 caracteres',
  })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  readonly firstName: string;

  @ApiProperty({
    description: 'Sobrenome do usuário.',
    example: 'Doe',
  })
  @IsString({ message: 'O sobrenome deve ser um texto' })
  @MinLength(1, {
    message: 'O sobrenome deve conter pelo menos 1 caracteres',
  })
  @IsNotEmpty({ message: 'O sobrenome não pode estar vazio' })
  readonly lastName: string;

  @ApiProperty({
    description: 'Endereço de e-mail único do usuário.',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  readonly email: string;

  @ApiProperty({
    description:
      'Senha de acesso forte contendo pelo menos 8 caracteres (maiúscula, minúscula, número e caractere especial).',
    example: 'Password@123',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'A senha deve conter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.',
    },
  )
  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  readonly password: string;
}
//#endregion
