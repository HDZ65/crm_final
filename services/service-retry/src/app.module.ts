import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { RetryPolicyModule } from './modules/retry-policy/retry-policy.module';
import { RetryScheduleModule } from './modules/retry-schedule/retry-schedule.module';
import { RetryAttemptModule } from './modules/retry-attempt/retry-attempt.module';
import { RetryJobModule } from './modules/retry-job/retry-job.module';
import { ReminderPolicyModule } from './modules/reminder-policy/reminder-policy.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

import { RetryController } from './retry.controller';

import { RetryPolicyEntity } from './modules/retry-policy/entities/retry-policy.entity';
import { RetryScheduleEntity } from './modules/retry-schedule/entities/retry-schedule.entity';
import { RetryAttemptEntity } from './modules/retry-attempt/entities/retry-attempt.entity';
import { RetryJobEntity } from './modules/retry-job/entities/retry-job.entity';
import { ReminderPolicyEntity } from './modules/reminder-policy/entities/reminder-policy.entity';
import { ReminderEntity } from './modules/reminder/entities/reminder.entity';
import { RetryAuditLogEntity } from './modules/audit-log/entities/retry-audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'retry_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          RetryPolicyEntity,
          RetryScheduleEntity,
          RetryAttemptEntity,
          RetryJobEntity,
          ReminderPolicyEntity,
          ReminderEntity,
          RetryAuditLogEntity,
        ],
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    RetryPolicyModule,
    RetryScheduleModule,
    RetryAttemptModule,
    RetryJobModule,
    ReminderPolicyModule,
    ReminderModule,
    AuditLogModule,
    SchedulerModule,
  ],
  controllers: [RetryController],
})
export class AppModule {}
