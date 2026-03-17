# Service-Telecom

Microservice d'orchestration telecom (pattern Saga) pour le cycle J+14:

- `ContratSigné` -> client/abonnement en `Attente`, demande mandat SEPA
- `DélaiRétractationÉcoulé` -> abonnement GoCardless, expédition SIM, activation Transatel
- Compensation si activation échoue après succès billing

## Architecture DDD

```
src/
├── domain/
├── infrastructure/
├── migrations/
├── provisioning.module.ts
├── app.module.ts
└── main.ts
```

## Sujets NATS intégrés

- Inbound: `contract.signed`, `crm.telecom.contrat.signe`
- Inbound: `crm.provisioning.delai_retractation.ecoule`
- Inbound: `payment.gocardless.succeeded`
- Outbound: `crm.commercial.subscription.activated`, `crm.commercial.subscription.canceled`
- Outbound: `crm.provisioning.sim.expedition.requested`
- Outbound: `crm.telecom.adv.notification.requested`
