import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  //#region Setup
  constructor(private readonly appService: AppService) {}
  //#endregion

  //#region Routes
  @Get()
  getHello(): object {
    return this.appService.getHello();
  }
  //#endregion
}
