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
  UseInterceptors,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/createTask.dto';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { LoggerInterceptor } from 'src/common/interceptors/logger.interceptor';
import { CreateBodyInterceptor } from 'src/common/interceptors/createTaskBody.interceptor';
import { AddHeaderInterceptor } from 'src/common/interceptors/addHeader.interceptor';
//#endregion

@Controller('tasks')
export class TasksController {
  //#region Setup
  constructor(private readonly tasksService: TasksService) {}
  //#endregion

  //#region Routes
  @Get()
  @UseInterceptors(LoggerInterceptor)
  @UseInterceptors(AddHeaderInterceptor)
  listAllTasks(@Query() paginationDto: PaginationDto) {
    return this.tasksService.listAll(paginationDto);
  }

  @Get(':id')
  findTaskById(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findTaskById(id);
  }

  @Post()
  @UseInterceptors(CreateBodyInterceptor)
  createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(createTaskDto);
  }

  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(id, updateTaskDto);
  }

  @Delete(':id')
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.deleteTask(id);
  }
  //#endregion
}
