import { Injectable } from '@nestjs/common';
import { Task } from './entities/task.entity';
import { throwError } from 'src/common/errors/core/errors.factory';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { CreateTaskDto } from './dto/createTask.dto';

@Injectable()
export class TasksService {
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

  listAll() {
    return this.tasks;
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
