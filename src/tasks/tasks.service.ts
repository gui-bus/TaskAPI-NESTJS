import { Injectable } from '@nestjs/common';
import { Task } from './entities/task.entity';
import { throwError } from 'src/common/errors/core/errors.factory';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { CreateTaskDto } from './dto/createTask.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private tasks: Task[] = [
    {
      id: 1,
      name: 'Finalizar relatório trimestral de desempenho',
      description:
        'Consolidar indicadores, alinhar insights com as áreas envolvidas e preparar a apresentação para o comitê executivo.',
      completed: true,
    },
    {
      id: 2,
      name: 'Implementar fluxo de onboarding do usuário',
      description:
        'Desenvolver o passo a passo inicial, integrar eventos de analytics e validar microinterações para otimizar a retenção.',
      completed: false,
    },
  ];

  async listAll() {
    const allTasks = await this.prisma.task.findMany();
    return allTasks;
  }

  findTaskById(id: number) {
    const task = this.tasks.find((task) => task.id === id);

    if (task) return task;

    throwError('TASK_NOT_FOUND');
  }

  createTask(createTaskDto: CreateTaskDto) {
    const newId = this.tasks.length + 1;
    const newTask = {
      id: newId,
      ...createTaskDto,
      completed: false,
    };

    this.tasks.push(newTask);

    return {
      message: 'Tarefa criada com sucesso',
      task: newTask,
    };
  }

  updateTask(id: number, updateTaskDto: UpdateTaskDto) {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);

    if (taskIndex < 0) {
      throwError('TASK_NOT_FOUND');
    }

    const taskItem = this.tasks[taskIndex];

    this.tasks[taskIndex] = {
      ...taskItem,
      ...updateTaskDto,
    };

    return {
      message: 'Tarefa atualizada com sucesso',
      task: this.tasks[taskIndex],
    };
  }

  deleteTask(id: number) {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);

    if (taskIndex < 0) {
      throwError('TASK_NOT_FOUND');
    }

    const taskItem = this.tasks[taskIndex];

    this.tasks.splice(taskIndex, 1);

    return {
      message: 'Tarefa excluida com sucesso',
      task: taskItem,
    };
  }
}
