//#region Imports
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
//#endregion

import { ApiProperty } from '@nestjs/swagger';

//#region DTO
export class CreateTaskDto {
  @ApiProperty({
    description: 'Título ou nome curto identificando a tarefa.',
    example: 'Comprar mantimentos',
  })
  @IsString({ message: 'O nome deve ser um texto' })
  @MinLength(5, { message: 'O nome deve conter pelo menos 5 caracteres' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  readonly name: string;

  @ApiProperty({
    description:
      'Descrição detalhada sobre o que precisa ser feito na tarefa (mínimo de 30 caracteres).',
    example:
      'Ir ao supermercado para comprar leite, ovos, pão e frutas frescas.',
  })
  @IsString({ message: 'A descrição deve ser um texto' })
  @MinLength(30, {
    message: 'A descrição deve conter pelo menos 30 caracteres',
  })
  @IsNotEmpty({ message: 'A descrição não pode estar vazio' })
  readonly description: string;
}
//#endregion
