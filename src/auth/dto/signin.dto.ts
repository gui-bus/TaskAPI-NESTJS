import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({
    description: 'Endereço de e-mail do usuário para autenticação.',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha cadastrada do usuário.',
    example: 'Password@123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
