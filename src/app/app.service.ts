//#region Imports
import { Injectable } from '@nestjs/common';
//#endregion

@Injectable()
export class AppService {
  //#region Queries
  getHello(): object {
    return {
      message: 'Welcome to the Task API!',
      status: 'active',
      documentation: '/docs',
    };
  }
  //#endregion
}
