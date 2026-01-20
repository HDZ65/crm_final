import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { OrchestrationCommandDto } from '../../../../../applications/dto/contract-orchestration/orchestration-command.dto';
import { ActivateContractUseCase } from '../../../../../applications/usecase/contract-orchestration/activate-contract.usecase';
import { SuspendContractUseCase } from '../../../../../applications/usecase/contract-orchestration/suspend-contract.usecase';
import { TerminateContractUseCase } from '../../../../../applications/usecase/contract-orchestration/terminate-contract.usecase';
import { PortInContractUseCase } from '../../../../../applications/usecase/contract-orchestration/port-in-contract.usecase';

@Controller('orchestration/contracts')
export class ContractOrchestrationController {
  constructor(
    private readonly activateUseCase: ActivateContractUseCase,
    private readonly suspendUseCase: SuspendContractUseCase,
    private readonly terminateUseCase: TerminateContractUseCase,
    private readonly portInUseCase: PortInContractUseCase,
  ) {}

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post(':contractId/activate')
  @HttpCode(HttpStatus.ACCEPTED)
  async activate(
    @Param('contractId') contractId: string,
    @Body() dto: OrchestrationCommandDto,
  ): Promise<void> {
    await this.activateUseCase.execute(contractId, dto);
  }

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post(':contractId/suspend')
  @HttpCode(HttpStatus.ACCEPTED)
  async suspend(
    @Param('contractId') contractId: string,
    @Body() dto: OrchestrationCommandDto,
  ): Promise<void> {
    await this.suspendUseCase.execute(contractId, dto);
  }

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post(':contractId/terminate')
  @HttpCode(HttpStatus.ACCEPTED)
  async terminate(
    @Param('contractId') contractId: string,
    @Body() dto: OrchestrationCommandDto,
  ): Promise<void> {
    await this.terminateUseCase.execute(contractId, dto);
  }

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post(':contractId/port-in')
  @HttpCode(HttpStatus.ACCEPTED)
  async portIn(
    @Param('contractId') contractId: string,
    @Body() dto: OrchestrationCommandDto,
  ): Promise<void> {
    await this.portInUseCase.execute(contractId, dto);
  }
}
