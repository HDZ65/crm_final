import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { resolveProtoPath } from '@crm/shared-kernel';
import { ContratGrpcClient } from './contrat-grpc.client';

const grpcLoaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const grpcChannelOptions = {
  'grpc.max_receive_message_length': 20 * 1024 * 1024,
  'grpc.max_send_message_length': 20 * 1024 * 1024,
};

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ENGAGEMENT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: ['activites', 'notifications', 'email', 'agenda', 'wincash'],
          protoPath: [
            resolveProtoPath('activites/activites.proto'),
            resolveProtoPath('notifications/notifications.proto'),
            resolveProtoPath('email/email.proto'),
            resolveProtoPath('agenda/agenda.proto'),
            resolveProtoPath('services/wincash.proto'),
          ],
          url: process.env.GRPC_ENGAGEMENT_URL || 'localhost:50051',
          loader: grpcLoaderOptions,
          channelOptions: grpcChannelOptions,
        },
      },
      {
        name: 'CORE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: ['users', 'clients', 'documents', 'dashboard', 'organisations', 'depanssur'],
          protoPath: [
            resolveProtoPath('organisations/users.proto'),
            resolveProtoPath('clients/clients.proto'),
            resolveProtoPath('documents/documents.proto'),
            resolveProtoPath('dashboard/dashboard.proto'),
            resolveProtoPath('organisations/organisations.proto'),
            resolveProtoPath('depanssur/depanssur.proto'),
          ],
          url: process.env.GRPC_CORE_URL || 'localhost:50052',
          loader: grpcLoaderOptions,
          channelOptions: grpcChannelOptions,
        },
      },
      {
        name: 'COMMERCIAL_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: [
            'commerciaux',
            'contrats',
            'products',
            'commission',
            'dashboard',
            'bundle',
            'subscriptions',
            'woocommerce',
            'partenaires',
            'cfast',
          ],
          protoPath: [
            resolveProtoPath('commerciaux/commerciaux.proto'),
            resolveProtoPath('contrats/contrats.proto'),
            resolveProtoPath('products/products.proto'),
            resolveProtoPath('commission/commission.proto'),
            resolveProtoPath('dashboard/dashboard.proto'),
            resolveProtoPath('services/bundle.proto'),
            resolveProtoPath('subscriptions/subscriptions.proto'),
            resolveProtoPath('woocommerce/woocommerce.proto'),
            resolveProtoPath('partenaires/partenaires.proto'),
            resolveProtoPath('cfast/cfast.proto'),
          ],
          url: process.env.GRPC_COMMERCIAL_URL || 'localhost:50053',
          loader: grpcLoaderOptions,
          channelOptions: grpcChannelOptions,
        },
      },
      {
        name: 'FINANCE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: ['factures', 'invoice', 'payment', 'calendar'],
          protoPath: [
            resolveProtoPath('factures/factures.proto'),
            resolveProtoPath('factures/invoice.proto'),
            resolveProtoPath('payments/payment.proto'),
            resolveProtoPath('calendar/calendar.proto'),
          ],
          url: process.env.GRPC_FINANCE_URL || 'localhost:50059',
          loader: grpcLoaderOptions,
          channelOptions: grpcChannelOptions,
        },
      },
      {
        name: 'LOGISTICS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'logistics',
          protoPath: resolveProtoPath('logistics/logistics.proto'),
          url: process.env.GRPC_LOGISTICS_URL || 'localhost:50060',
          loader: grpcLoaderOptions,
          channelOptions: grpcChannelOptions,
        },
      },
    ]),
  ],
  providers: [ContratGrpcClient],
  exports: [ClientsModule, ContratGrpcClient],
})
export class GrpcClientModule {}
