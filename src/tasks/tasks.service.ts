import { Injectable } from '@nestjs/common';
import { Task } from './entities/task.entity';
import { throwError } from 'src/common/errors/core/errors.factory';

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

  findTaskById(id: string) {
    const task = this.tasks.find((task) => task.id === Number(id));

    if (task) return task;

    throwError('TASK_NOT_FOUND');
  }

  createTask(body: any) {
    const newId = this.tasks.length + 1;
    const newTask = {
      id: newId,
      ...body,
    };

    this.tasks.push(newTask);

    return {
      message: 'Tarefa criada com sucesso',
      task: newTask,
    };
  }

  updateTask(id: string, body: any) {
    const taskIndex = this.tasks.findIndex((task) => task.id === Number(id));

    if (taskIndex < 0) {
      throwError('TASK_NOT_FOUND');
    }

    const taskItem = this.tasks[taskIndex];

    this.tasks[taskIndex] = {
      ...taskItem,
      ...body,
    };

    return {
      message: 'Tarefa atualizada com sucesso',
      task: this.tasks[taskIndex],
    };
  }

  deleteTask(id: string) {
    const taskIndex = this.tasks.findIndex((task) => task.id === Number(id));

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
