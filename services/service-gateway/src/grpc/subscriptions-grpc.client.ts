import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface SubscriptionPlanServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
}

export interface SubscriptionServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  Activate(data: Record<string, unknown>): Observable<unknown>;
  Pause(data: Record<string, unknown>): Observable<unknown>;
  Resume(data: Record<string, unknown>): Observable<unknown>;
  Cancel(data: Record<string, unknown>): Observable<unknown>;
  Suspend(data: Record<string, unknown>): Observable<unknown>;
  Reactivate(data: Record<string, unknown>): Observable<unknown>;
  Expire(data: Record<string, unknown>): Observable<unknown>;
  GetDueForCharge(data: Record<string, unknown>): Observable<unknown>;
  GetDueForTrialConversion(data: Record<string, unknown>): Observable<unknown>;
  ListByClient(data: Record<string, unknown>): Observable<unknown>;
  ListByPlan(data: Record<string, unknown>): Observable<unknown>;
}

export interface SubscriptionPreferenceSchemaServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface SubscriptionPreferenceServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  GetBySubscription(data: Record<string, unknown>): Observable<unknown>;
}

export interface WooCommerceServiceClient {
  CreateMapping(data: Record<string, unknown>): Observable<unknown>;
  UpdateMapping(data: Record<string, unknown>): Observable<unknown>;
  GetMapping(data: Record<string, unknown>): Observable<unknown>;
  ListMappings(data: Record<string, unknown>): Observable<unknown>;
  DeleteMapping(data: Record<string, unknown>): Observable<unknown>;
  ProcessWebhook(data: Record<string, unknown>): Observable<unknown>;
  GetConfig(data: Record<string, unknown>): Observable<unknown>;
  UpdateConfig(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class SubscriptionsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsGrpcClient.name);
  private subscriptionPlanService: SubscriptionPlanServiceClient;
  private subscriptionService: SubscriptionServiceClient;
  private subscriptionPreferenceSchemaService: SubscriptionPreferenceSchemaServiceClient;
  private subscriptionPreferenceService: SubscriptionPreferenceServiceClient;
  private wooCommerceService: WooCommerceServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.subscriptionPlanService =
      this.client.getService<SubscriptionPlanServiceClient>('SubscriptionPlanService');
    this.subscriptionService =
      this.client.getService<SubscriptionServiceClient>('SubscriptionService');
    this.subscriptionPreferenceSchemaService =
      this.client.getService<SubscriptionPreferenceSchemaServiceClient>(
        'SubscriptionPreferenceSchemaService',
      );
    this.subscriptionPreferenceService =
      this.client.getService<SubscriptionPreferenceServiceClient>(
        'SubscriptionPreferenceService',
      );
    this.wooCommerceService =
      this.client.getService<WooCommerceServiceClient>('WooCommerceService');
  }

  createPlan(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPlanService.Create(data),
      this.logger,
      'SubscriptionPlanService',
      'Create',
    );
  }

  updatePlan(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPlanService.Update(data),
      this.logger,
      'SubscriptionPlanService',
      'Update',
    );
  }

  getPlan(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPlanService.Get(data),
      this.logger,
      'SubscriptionPlanService',
      'Get',
    );
  }

  listPlans(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPlanService.List(data),
      this.logger,
      'SubscriptionPlanService',
      'List',
    );
  }

  deletePlan(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPlanService.Delete(data),
      this.logger,
      'SubscriptionPlanService',
      'Delete',
    );
  }

  listPlansByOrganisation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPlanService.ListByOrganisation(data),
      this.logger,
      'SubscriptionPlanService',
      'ListByOrganisation',
    );
  }

  createSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Create(data),
      this.logger,
      'SubscriptionService',
      'Create',
    );
  }

  updateSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Update(data),
      this.logger,
      'SubscriptionService',
      'Update',
    );
  }

  getSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Get(data),
      this.logger,
      'SubscriptionService',
      'Get',
    );
  }

  listSubscriptions(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.List(data),
      this.logger,
      'SubscriptionService',
      'List',
    );
  }

  deleteSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Delete(data),
      this.logger,
      'SubscriptionService',
      'Delete',
    );
  }

  activateSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Activate(data),
      this.logger,
      'SubscriptionService',
      'Activate',
    );
  }

  pauseSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Pause(data),
      this.logger,
      'SubscriptionService',
      'Pause',
    );
  }

  resumeSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Resume(data),
      this.logger,
      'SubscriptionService',
      'Resume',
    );
  }

  cancelSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Cancel(data),
      this.logger,
      'SubscriptionService',
      'Cancel',
    );
  }

  suspendSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Suspend(data),
      this.logger,
      'SubscriptionService',
      'Suspend',
    );
  }

  reactivateSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Reactivate(data),
      this.logger,
      'SubscriptionService',
      'Reactivate',
    );
  }

  expireSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.Expire(data),
      this.logger,
      'SubscriptionService',
      'Expire',
    );
  }

  getDueForCharge(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.GetDueForCharge(data),
      this.logger,
      'SubscriptionService',
      'GetDueForCharge',
    );
  }

  getDueForTrialConversion(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.GetDueForTrialConversion(data),
      this.logger,
      'SubscriptionService',
      'GetDueForTrialConversion',
    );
  }

  listSubscriptionsByClient(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.ListByClient(data),
      this.logger,
      'SubscriptionService',
      'ListByClient',
    );
  }

  listSubscriptionsByPlan(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionService.ListByPlan(data),
      this.logger,
      'SubscriptionService',
      'ListByPlan',
    );
  }

  createPreferenceSchema(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceSchemaService.Create(data),
      this.logger,
      'SubscriptionPreferenceSchemaService',
      'Create',
    );
  }

  updatePreferenceSchema(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceSchemaService.Update(data),
      this.logger,
      'SubscriptionPreferenceSchemaService',
      'Update',
    );
  }

  getPreferenceSchema(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceSchemaService.Get(data),
      this.logger,
      'SubscriptionPreferenceSchemaService',
      'Get',
    );
  }

  listPreferenceSchemas(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceSchemaService.List(data),
      this.logger,
      'SubscriptionPreferenceSchemaService',
      'List',
    );
  }

  deletePreferenceSchema(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceSchemaService.Delete(data),
      this.logger,
      'SubscriptionPreferenceSchemaService',
      'Delete',
    );
  }

  createPreference(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceService.Create(data),
      this.logger,
      'SubscriptionPreferenceService',
      'Create',
    );
  }

  updatePreference(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceService.Update(data),
      this.logger,
      'SubscriptionPreferenceService',
      'Update',
    );
  }

  getPreference(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceService.Get(data),
      this.logger,
      'SubscriptionPreferenceService',
      'Get',
    );
  }

  listPreferences(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceService.List(data),
      this.logger,
      'SubscriptionPreferenceService',
      'List',
    );
  }

  deletePreference(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceService.Delete(data),
      this.logger,
      'SubscriptionPreferenceService',
      'Delete',
    );
  }

  getPreferenceBySubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.subscriptionPreferenceService.GetBySubscription(data),
      this.logger,
      'SubscriptionPreferenceService',
      'GetBySubscription',
    );
  }

  createWooCommerceMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.CreateMapping(data),
      this.logger,
      'WooCommerceService',
      'CreateMapping',
    );
  }

  updateWooCommerceMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.UpdateMapping(data),
      this.logger,
      'WooCommerceService',
      'UpdateMapping',
    );
  }

  getWooCommerceMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.GetMapping(data),
      this.logger,
      'WooCommerceService',
      'GetMapping',
    );
  }

  listWooCommerceMappings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.ListMappings(data),
      this.logger,
      'WooCommerceService',
      'ListMappings',
    );
  }

  deleteWooCommerceMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.DeleteMapping(data),
      this.logger,
      'WooCommerceService',
      'DeleteMapping',
    );
  }

  processWooCommerceWebhook(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.ProcessWebhook(data),
      this.logger,
      'WooCommerceService',
      'ProcessWebhook',
    );
  }

  getWooCommerceConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.GetConfig(data),
      this.logger,
      'WooCommerceService',
      'GetConfig',
    );
  }

  updateWooCommerceConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.wooCommerceService.UpdateConfig(data),
      this.logger,
      'WooCommerceService',
      'UpdateConfig',
    );
  }
}
