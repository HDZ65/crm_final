import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getGrpcClientModuleOptions } from '@crm/grpc-utils';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'USERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const baseOptions = getGrpcClientModuleOptions('USERS_SERVICE', 'users');
          return {
            ...baseOptions,
            options: {
              ...baseOptions.options,
              url: configService.get('USERS_SERVICE_URL', 'service-users:50067'),
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class UsersClientModule {}
