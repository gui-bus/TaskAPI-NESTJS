//#region Imports
import { Injectable } from '@nestjs/common';
//#endregion

@Injectable()
export class AppService {
  //#region Queries
  getHello(): string {
    return 'AAAAAAA';
  }
  //#endregion
}
