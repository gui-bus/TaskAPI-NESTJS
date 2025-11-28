import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString({ message: 'O nome deve ser um texto' })
  @MinLength(5, { message: 'O nome deve conter pelo menos 5 caracteres' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  readonly name: string;

  @IsString({ message: 'A descrição deve ser um texto' })
  @MinLength(30, {
    message: 'A descrição deve conter pelo menos 30 caracteres',
  })
  @IsNotEmpty({ message: 'A descrição não pode estar vazio' })
  readonly description: string;
}
