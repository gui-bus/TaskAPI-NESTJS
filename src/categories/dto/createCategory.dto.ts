import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nome da categoria/tag.',
    example: 'Estudos',
  })
  @IsString({ message: 'O nome da categoria deve ser um texto' })
  @MinLength(2, {
    message: 'O nome da categoria deve conter pelo menos 2 caracteres',
  })
  @IsNotEmpty({ message: 'O nome da categoria não pode estar vazio' })
  readonly name: string;
}
