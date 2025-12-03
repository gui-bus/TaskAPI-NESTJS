import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(0, { message: 'O limite deve ser maior ou igual a 0' })
  @Max(50, { message: 'O limite deve ser menor ou igual a 50' })
  @Type(() => Number)
  limit: number;

  @IsOptional()
  @IsInt({ message: 'O deslocamento deve ser um número inteiro' })
  @Min(0, { message: 'O deslocamento deve ser maior ou igual a 0' })
  @Type(() => Number)
  offset: number;
}
