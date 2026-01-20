import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'USERS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'users',
            protoPath: join(__dirname, '../../../proto/users.proto'),
            url: configService.get('USERS_SERVICE_URL', 'localhost:50063'),
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class UsersClientModule {}
