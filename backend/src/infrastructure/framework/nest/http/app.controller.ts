import { Controller, Get } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { DatabaseService } from '../../../db/database.service';

@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Public()
  @Get()
  getHello(): string {
    return 'Hello World! Clean Architecture initialized.';
  }

  @Public()
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get('database/test')
  async testDatabase() {
    const testResult = await this.databaseService.testConnection();
    const connectionInfo = this.databaseService.getConnectionInfo();

    return {
      ...testResult,
      connectionInfo,
    };
  }

  @Public()
  @Get('database/info')
  getDatabaseInfo() {
    return this.databaseService.getConnectionInfo();
  }
}
