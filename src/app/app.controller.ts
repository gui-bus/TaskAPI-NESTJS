//#region Imports
import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
//#endregion

@Controller()
export class AppController {
  //#region Setup
  constructor(private readonly appService: AppService) {}
  //#endregion

  //#region Routes
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/teste')
  getTest() {
    return 'Rota GET teste';
  }

  @Post('/teste')
  createTest() {
    return 'Rota POST teste';
  }
  //#endregion
}
