//#region Imports
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/createTask.dto';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guard/authToken.guard';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';
import { TokenPayloadParam } from 'src/auth/param/tokenPayload.param';
//#endregion

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Tarefas')
@Controller('tasks')
export class TasksController {
  //#region Setup
  constructor(private readonly tasksService: TasksService) {}
  //#endregion

  //#region Routes
  @ApiOperation({
    summary: 'Listar tarefas',
    description: 'Retorna uma lista paginada de todas as tarefas cadastradas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tarefas retornada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de paginação inválidos.',
  })
  @Get()
  listAllTasks(@Query() paginationDto: PaginationDto) {
    return this.tasksService.listAllTasks(paginationDto);
  }

  @ApiOperation({
    summary: 'Buscar tarefa por ID',
    description:
      'Busca os detalhes de uma tarefa específica do usuário autenticado.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Tarefa encontrada.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada.' })
  @UseGuards(AuthTokenGuard)
  @Get(':id')
  findTaskById(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.tasksService.findTaskById(id, tokenPayload);
  }

  @ApiOperation({
    summary: 'Criar tarefa',
    description: 'Cria uma nova tarefa associada ao usuário autenticado.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Tarefa criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @UseGuards(AuthTokenGuard)
  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.tasksService.createTask(createTaskDto, tokenPayload);
  }

  @ApiOperation({
    summary: 'Atualizar tarefa',
    description:
      'Atualiza o status ou conteúdo de uma tarefa pertencente ao usuário autenticado.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Tarefa atualizada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Proibido de atualizar tarefa de outro usuário.',
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada.' })
  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.tasksService.updateTask(id, updateTaskDto, tokenPayload);
  }

  @ApiOperation({
    summary: 'Excluir tarefa (Soft Delete)',
    description:
      'Marca a tarefa correspondente ao ID como excluída (soft delete) para o usuário autenticado.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Tarefa excluída com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Proibido de excluir tarefa de outro usuário.',
  })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada.' })
  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.tasksService.deleteTask(id, tokenPayload);
  }
  //#endregion
}
