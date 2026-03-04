import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { SubscriptionsGrpcClient } from '../grpc/subscriptions-grpc.client';

@ApiTags('Subscriptions')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsClient: SubscriptionsGrpcClient) {}

  @Post('plans')
  @ApiOperation({ summary: 'Create a subscription plan' })
  createPlan(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.createPlan(body));
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update a subscription plan' })
  updatePlan(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.updatePlan({ ...body, id }));
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a subscription plan by id' })
  getPlan(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.getPlan({ id }));
  }

  @Post('plans/search')
  @ApiOperation({ summary: 'List subscription plans' })
  listPlans(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listPlans(body));
  }

  @Post('plans/by-organisation')
  @ApiOperation({ summary: 'List subscription plans by organisation' })
  listPlansByOrganisation(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listPlansByOrganisation(body));
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Delete a subscription plan' })
  deletePlan(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.deletePlan({ id }));
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a subscription' })
  createSubscription(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.createSubscription(body));
  }

  @Put('subscriptions/:id')
  @ApiOperation({ summary: 'Update a subscription' })
  updateSubscription(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.updateSubscription({ ...body, id }),
    );
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Get a subscription by id' })
  getSubscription(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.getSubscription({ id }));
  }

  @Post('subscriptions/search')
  @ApiOperation({ summary: 'List subscriptions' })
  listSubscriptions(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listSubscriptions(body));
  }

  @Delete('subscriptions/:id')
  @ApiOperation({ summary: 'Delete a subscription' })
  deleteSubscription(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.deleteSubscription({ id }));
  }

  @Post('subscriptions/:id/activate')
  @ApiOperation({ summary: 'Activate a subscription' })
  activateSubscription(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.activateSubscription({ ...body, id }),
    );
  }

  @Post('subscriptions/:id/pause')
  @ApiOperation({ summary: 'Pause a subscription' })
  pauseSubscription(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.subscriptionsClient.pauseSubscription({ ...body, id }),
    );
  }

  @Post('subscriptions/:id/resume')
  @ApiOperation({ summary: 'Resume a subscription' })
  resumeSubscription(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.resumeSubscription({ ...body, id }),
    );
  }

  @Post('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  cancelSubscription(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.cancelSubscription({ ...body, id }),
    );
  }

  @Post('subscriptions/:id/suspend')
  @ApiOperation({ summary: 'Suspend a subscription' })
  suspendSubscription(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.suspendSubscription({ ...body, id }),
    );
  }

  @Post('subscriptions/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a subscription' })
  reactivateSubscription(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.reactivateSubscription({ ...body, id }),
    );
  }

  @Post('subscriptions/:id/expire')
  @ApiOperation({ summary: 'Expire a subscription' })
  expireSubscription(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.subscriptionsClient.expireSubscription({ ...body, id }),
    );
  }

  @Post('subscriptions/due-for-charge')
  @ApiOperation({ summary: 'Get subscriptions due for charge' })
  getDueForCharge(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.getDueForCharge(body));
  }

  @Post('subscriptions/due-for-trial-conversion')
  @ApiOperation({ summary: 'Get subscriptions due for trial conversion' })
  getDueForTrialConversion(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.getDueForTrialConversion(body));
  }

  @Post('subscriptions/by-client')
  @ApiOperation({ summary: 'List subscriptions by client' })
  listSubscriptionsByClient(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listSubscriptionsByClient(body));
  }

  @Post('subscriptions/by-plan')
  @ApiOperation({ summary: 'List subscriptions by plan' })
  listSubscriptionsByPlan(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listSubscriptionsByPlan(body));
  }

  @Post('preference-schemas')
  @ApiOperation({ summary: 'Create a subscription preference schema' })
  createPreferenceSchema(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.createPreferenceSchema(body));
  }

  @Put('preference-schemas/:id')
  @ApiOperation({ summary: 'Update a subscription preference schema' })
  updatePreferenceSchema(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.updatePreferenceSchema({ ...body, id }),
    );
  }

  @Get('preference-schemas/:id')
  @ApiOperation({ summary: 'Get a subscription preference schema by id' })
  getPreferenceSchema(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.getPreferenceSchema({ id }));
  }

  @Post('preference-schemas/search')
  @ApiOperation({ summary: 'List subscription preference schemas' })
  listPreferenceSchemas(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listPreferenceSchemas(body));
  }

  @Delete('preference-schemas/:id')
  @ApiOperation({ summary: 'Delete a subscription preference schema' })
  deletePreferenceSchema(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.deletePreferenceSchema({ id }));
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Create a subscription preference' })
  createPreference(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.createPreference(body));
  }

  @Put('preferences/:id')
  @ApiOperation({ summary: 'Update a subscription preference' })
  updatePreference(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(this.subscriptionsClient.updatePreference({ ...body, id }));
  }

  @Get('preferences/:id')
  @ApiOperation({ summary: 'Get a subscription preference by id' })
  getPreference(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.getPreference({ id }));
  }

  @Post('preferences/search')
  @ApiOperation({ summary: 'List subscription preferences' })
  listPreferences(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listPreferences(body));
  }

  @Delete('preferences/:id')
  @ApiOperation({ summary: 'Delete a subscription preference' })
  deletePreference(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.deletePreference({ id }));
  }

  @Get('preferences/by-subscription/:subscriptionId')
  @ApiOperation({ summary: 'Get preference by subscription id' })
  getPreferenceBySubscription(@Param('subscriptionId') subscriptionId: string) {
    return firstValueFrom(
      this.subscriptionsClient.getPreferenceBySubscription({ subscription_id: subscriptionId }),
    );
  }

  @Post('woocommerce-sync/mappings')
  @ApiOperation({ summary: 'Create a WooCommerce mapping' })
  createWooCommerceMapping(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.createWooCommerceMapping(body));
  }

  @Put('woocommerce-sync/mappings/:id')
  @ApiOperation({ summary: 'Update a WooCommerce mapping' })
  updateWooCommerceMapping(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.updateWooCommerceMapping({ ...body, id }),
    );
  }

  @Get('woocommerce-sync/mappings/:id')
  @ApiOperation({ summary: 'Get a WooCommerce mapping by id' })
  getWooCommerceMapping(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.getWooCommerceMapping({ id }));
  }

  @Post('woocommerce-sync/mappings/search')
  @ApiOperation({ summary: 'List WooCommerce mappings' })
  listWooCommerceMappings(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.listWooCommerceMappings(body));
  }

  @Delete('woocommerce-sync/mappings/:id')
  @ApiOperation({ summary: 'Delete a WooCommerce mapping' })
  deleteWooCommerceMapping(@Param('id') id: string) {
    return firstValueFrom(this.subscriptionsClient.deleteWooCommerceMapping({ id }));
  }

  @Post('woocommerce-sync/webhooks/process')
  @ApiOperation({ summary: 'Process a WooCommerce webhook' })
  processWooCommerceWebhook(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.processWooCommerceWebhook(body));
  }

  @Post('woocommerce-sync/config/get')
  @ApiOperation({ summary: 'Get WooCommerce config' })
  getWooCommerceConfig(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.subscriptionsClient.getWooCommerceConfig(body));
  }

  @Put('woocommerce-sync/config/:id')
  @ApiOperation({ summary: 'Update WooCommerce config' })
  updateWooCommerceConfig(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.subscriptionsClient.updateWooCommerceConfig({ ...body, id }),
    );
  }
}
