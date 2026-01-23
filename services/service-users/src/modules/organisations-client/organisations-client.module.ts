import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganisationsClientService } from './organisations-client.service';

@Module({
  imports: [ConfigModule],
  providers: [OrganisationsClientService],
  exports: [OrganisationsClientService],
})
export class OrganisationsClientModule {}
