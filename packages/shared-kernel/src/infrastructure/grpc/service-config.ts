/**
 * Service configuration registry
 * Single source of truth for all gRPC service configurations
 */

export interface ServiceConfig {
  /** gRPC package name (must match .proto file) */
  package: string;
  /** Proto file path relative to proto/src/ */
  protoFile: string;
  /** Default port for the service */
  defaultPort: number;
  /** Service name for logging/debugging */
  serviceName: string;
}

/**
 * Registry of all CRM gRPC services
 */
export const SERVICE_REGISTRY: Record<string, ServiceConfig> = {
  activites: {
    package: 'activites',
    protoFile: 'activites/activites.proto',
    defaultPort: 50051,
    serviceName: 'ActivitesService',
  },
  clients: {
    package: 'clients',
    protoFile: 'clients/clients.proto',
    defaultPort: 50052,
    serviceName: 'ClientsService',
  },
  commerciaux: {
    package: 'commerciaux',
    protoFile: 'commerciaux/commerciaux.proto',
    defaultPort: 50053,
    serviceName: 'CommerciauxService',
  },
  commission: {
    package: 'commission',
    protoFile: 'commission/commission.proto',
    defaultPort: 50054,
    serviceName: 'CommissionService',
  },
  contrats: {
    package: 'contrats',
    protoFile: 'contrats/contrats.proto',
    defaultPort: 50055,
    serviceName: 'ContratsService',
  },
  dashboard: {
    package: 'dashboard',
    protoFile: 'dashboard/dashboard.proto',
    defaultPort: 50056,
    serviceName: 'DashboardService',
  },
  documents: {
    package: 'documents',
    protoFile: 'documents/documents.proto',
    defaultPort: 50057,
    serviceName: 'DocumentsService',
  },
  email: {
    package: 'email',
    protoFile: 'email/email.proto',
    defaultPort: 50058,
    serviceName: 'EmailService',
  },
  factures: {
    package: 'factures',
    protoFile: 'factures/factures.proto',
    defaultPort: 50059,
    serviceName: 'FacturesService',
  },
  logistics: {
    package: 'logistics',
    protoFile: 'logistics/logistics.proto',
    defaultPort: 50060,
    serviceName: 'LogisticsService',
  },
  notifications: {
    package: 'notifications',
    protoFile: 'notifications/notifications.proto',
    defaultPort: 50061,
    serviceName: 'NotificationsService',
  },
  organisations: {
    package: 'organisations',
    protoFile: 'organisations/organisations.proto',
    defaultPort: 50062,
    serviceName: 'OrganisationsService',
  },
  depanssur: {
    package: 'depanssur',
    protoFile: 'depanssur/depanssur.proto',
    defaultPort: 50052,
    serviceName: 'DepanssurService',
  },
  payments: {
    package: 'payment',
    protoFile: 'payments/payment.proto',
    defaultPort: 50063,
    serviceName: 'PaymentService',
  },
  products: {
    package: 'products',
    protoFile: 'products/products.proto',
    defaultPort: 50064,
    serviceName: 'ProductsService',
  },
  referentiel: {
    package: 'referentiel',
    protoFile: 'referentiel/referentiel.proto',
    defaultPort: 50065,
    serviceName: 'ReferentielService',
  },
  relance: {
    package: 'relance',
    protoFile: 'relance/relance.proto',
    defaultPort: 50066,
    serviceName: 'RelanceService',
  },
  users: {
    package: 'users',
    protoFile: 'organisations/users.proto',
    defaultPort: 50067,
    serviceName: 'UsersService',
  },
  calendar: {
    package: 'calendar',
    protoFile: 'calendar/calendar.proto',
    defaultPort: 50068,
    serviceName: 'CalendarService',
  },
  retry: {
    package: 'retry',
    protoFile: 'retry/am04_retry_service.proto',
    defaultPort: 50069,
    serviceName: 'RetryService',
  },
  agenda: {
    package: 'agenda',
    protoFile: 'agenda/agenda.proto',
    defaultPort: 50051,
    serviceName: 'AgendaService',
  },
  wincash: {
    package: 'wincash',
    protoFile: 'services/wincash.proto',
    defaultPort: 50051,
    serviceName: 'WincashSvc',
  },
   bundle: {
     package: 'bundle',
     protoFile: 'services/bundle.proto',
     defaultPort: 50051,
     serviceName: 'BundleSvc',
   },
   subscriptions: {
     package: 'subscriptions',
     protoFile: 'subscriptions/subscriptions.proto',
     defaultPort: 50070,
     serviceName: 'SubscriptionService',
   },
   'subscription-plans': {
     package: 'subscriptions',
     protoFile: 'subscriptions/subscriptions.proto',
     defaultPort: 50071,
     serviceName: 'SubscriptionPlanService',
   },
   'subscription-preferences': {
     package: 'subscriptions',
     protoFile: 'subscriptions/subscriptions.proto',
     defaultPort: 50072,
     serviceName: 'SubscriptionPreferenceService',
   },
   'subscription-preference-schemas': {
     package: 'subscriptions',
     protoFile: 'subscriptions/subscriptions.proto',
     defaultPort: 50073,
     serviceName: 'SubscriptionPreferenceSchemaService',
   },
   woocommerce: {
     package: 'subscriptions',
     protoFile: 'subscriptions/subscriptions.proto',
     defaultPort: 50074,
     serviceName: 'WooCommerceService',
   },
   partenaires: {
     package: 'partenaires',
     protoFile: 'partenaires/partenaires.proto',
     defaultPort: 50053,
     serviceName: 'PartenaireCommercialService',
   },
   'fulfillment-batches': {
     package: 'fulfillment',
     protoFile: 'fulfillment/fulfillment.proto',
     defaultPort: 50075,
     serviceName: 'FulfillmentBatchService',
   },
   'fulfillment-cutoff': {
     package: 'fulfillment',
     protoFile: 'fulfillment/fulfillment.proto',
     defaultPort: 50076,
     serviceName: 'FulfillmentCutoffConfigService',
   },
} as const;

export type ServiceName = keyof typeof SERVICE_REGISTRY;

/**
 * Get configuration for a specific service
 */
export function getServiceConfig(serviceName: ServiceName): ServiceConfig {
  const config = SERVICE_REGISTRY[serviceName];
  if (!config) {
    throw new Error(`Unknown service: ${serviceName}. Valid services: ${Object.keys(SERVICE_REGISTRY).join(', ')}`);
  }
  return config;
}

/**
 * Get the gRPC URL for a service
 */
export function getServiceUrl(serviceName: ServiceName, host?: string): string {
  const config = getServiceConfig(serviceName);
  const envPort = process.env[`${serviceName.toUpperCase()}_GRPC_PORT`] || process.env.GRPC_PORT;
  const port = envPort || config.defaultPort;
  const serviceHost = host || process.env.GRPC_HOST || '0.0.0.0';
  return `${serviceHost}:${port}`;
}
