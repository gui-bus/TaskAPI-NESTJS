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

@Controller('tasks')
export class TasksController {
  //#region Setup
  constructor(private readonly tasksService: TasksService) {}
  //#endregion

  //#region Routes
  @Get()
  listAllTasks(@Query() paginationDto: PaginationDto) {
    return this.tasksService.listAllTasks(paginationDto);
  }

  @Get(':id')
  findTaskById(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.tasksService.findTaskById(id, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.tasksService.createTask(createTaskDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.tasksService.updateTask(id, updateTaskDto, tokenPayload);
  }

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
