import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TaskStatus } from 'prisma/generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListTasksDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Termo de busca textual para filtrar no nome ou descrição da tarefa.',
    example: 'supermercado',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar tarefas por status específico.',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'O status deve ser PENDING, IN_PROGRESS ou COMPLETED',
  })
  readonly status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Filtrar tarefas associadas a uma categoria/tag específica.',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly categoryId?: number;

  @ApiPropertyOptional({
    description: 'Campo pelo qual ordenar o resultado.',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  readonly sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sentido da ordenação (ascendente ou descendente).',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'], { message: 'A ordenação deve ser asc ou desc' })
  readonly sortOrder?: 'asc' | 'desc' = 'desc';
}
