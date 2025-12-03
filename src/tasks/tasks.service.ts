import { Injectable, Logger } from '@nestjs/common';
import { throwError } from 'src/common/errors/core/errors.factory';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { CreateTaskDto } from './dto/createTask.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { isPrismaError } from 'src/common/errors/helpers/isPrismaError';
import { logError } from 'src/common/errors/helpers/logError';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}

  async listAll() {
    try {
      return await this.prisma.task.findMany();
    } catch (error) {
      logError(this.logger, error);

      throwError('DATABASE_ERROR');
    }
  }

  async findTaskById(id: number) {
    try {
      const task = await this.prisma.task.findFirst({ where: { id } });

      if (!task) throwError('TASK_NOT_FOUND');

      return task;
    } catch (error) {
      logError(this.logger, error);

      if (isPrismaError(error)) {
        throw error;
      }

      throwError('DATABASE_ERROR');
    }
  }

  async createTask(createTaskDto: CreateTaskDto) {
    try {
      const newTask = await this.prisma.task.create({
        data: {
          name: createTaskDto.name,
          description: createTaskDto.description,
          completed: false,
        },
      });

      return {
        message: 'Tarefa criada com sucesso',
        task: newTask,
      };
    } catch (error) {
      logError(this.logger, error);

      throwError('DATABASE_ERROR');
    }
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto) {
    try {
      const task = await this.prisma.task.findFirst({ where: { id } });

      if (!task) throwError('TASK_NOT_FOUND');

      const updated = await this.prisma.task.update({
        where: { id },
        data: updateTaskDto,
      });

      return {
        message: 'Tarefa atualizada com sucesso',
        task: updated,
      };
    } catch (error) {
      logError(this.logger, error);

      if (isPrismaError(error)) {
        throw error;
      }

      throwError('DATABASE_ERROR');
    }
  }

  async deleteTask(id: number) {
    try {
      const task = await this.prisma.task.findFirst({ where: { id } });

      if (!task) throwError('TASK_NOT_FOUND');

      await this.prisma.task.delete({ where: { id } });

      return {
        message: 'Tarefa excluida com sucesso',
        task,
      };
    } catch (error) {
      logError(this.logger, error);

      if (isPrismaError(error)) {
        throw error;
      }

      throwError('DATABASE_ERROR');
    }
  }
}
