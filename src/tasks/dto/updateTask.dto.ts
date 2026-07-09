import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateTaskDto } from './createTask.dto';
import { TaskStatus } from 'prisma/generated/prisma/enums';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    description: 'Novo status da tarefa.',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsEnum(TaskStatus, {
    message: 'O status deve ser PENDING, IN_PROGRESS ou COMPLETED',
  })
  @IsOptional()
  readonly status?: TaskStatus;
}
//#endregion
