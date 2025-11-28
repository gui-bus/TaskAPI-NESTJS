import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTaskDto } from './createTask.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsBoolean({ message: 'O status deve ser verdadeiro ou falso' })
  @IsOptional()
  readonly completed?: boolean;
}
