# Diagrammes de Sequence Dynamiques - CRM

> Generees depuis l'analyse de la codebase reelle.
> Rendu: coller dans [mermaid.live](https://mermaid.live), VS Code (extension Mermaid), ou tout fichier `.md` sur GitHub.

---

## 1. Authentification JWT (Keycloak + NextAuth + gRPC)

**Fichiers sources:**
- `frontend/src/lib/auth/auth.config.ts` - Configuration NextAuth + Keycloak
- `frontend/src/middleware.ts` - Protection des routes
- `frontend/src/lib/auth/auth.server.ts` - Profil utilisateur SSR
- `services/service-core/src/infrastructure/grpc/users/auth-sync.controller.ts` - Sync Keycloak
- `services/service-core/src/infrastructure/grpc/users/compte.controller.ts` - Gestion comptes

sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant LP as Page Login (Next.js)
    participant MW as Middleware (middleware.ts)
    participant NA as NextAuth (auth.config.ts)
    participant KC as Keycloak (IdP OAuth2)
    participant GS as auth.server.ts (SSR)
    participant GRPC as service-core (gRPC)
    participant DB as PostgreSQL (core_db)

    Note over U, DB: PHASE 1 : LOGIN INITIAL

    U->>LP: Saisit email + mot de passe
    LP->>NA: signIn("credentials", {email, password})

    rect rgb(255, 245, 230)
        Note over NA, KC: Echange OAuth2 Resource Owner Password
        NA->>KC: POST /openid-connect/token<br/>grant_type=password, scope=openid email profile
        KC-->>KC: Verifie identifiants dans realm
        alt Identifiants invalides
            KC-->>NA: 401 Unauthorized
            NA-->>LP: error: "Email ou mot de passe incorrect"
            LP-->>U: Affiche erreur de connexion
        else Identifiants valides
            KC-->>NA: {access_token, refresh_token, expires_in}
        end
    end

    NA->>KC: GET /openid-connect/userinfo<br/>Authorization: Bearer {access_token}
    KC-->>NA: {sub, email, name, given_name, family_name}

    rect rgb(230, 255, 230)
        Note over NA: Callback JWT : Stocke tokens dans session
        NA-->>NA: jwt callback -> {accessToken, refreshToken, expiresAt}
        NA-->>NA: session callback -> session.accessToken = token
    end

    NA-->>LP: Session creee (JWT cookie httpOnly)
    LP-->>U: Redirect vers / (Dashboard)

    Note over U, DB: PHASE 2 : ACCES PAGE PROTEGEE

    U->>MW: GET /clients
    MW->>MW: auth(request) verifie session

    alt Pas de session ou RefreshTokenError
        MW-->>U: Redirect vers /login?callbackUrl=/clients
    else Session valide
        MW->>MW: isPublicRoute("/clients") = false, NextResponse.next()
    end

    Note over U, DB: PHASE 3 : CHARGEMENT PROFIL SERVEUR (SSR)

    rect rgb(230, 240, 255)
        GS->>GS: auth() puis parseJWT(accessToken) extrait keycloakId

        GS->>GRPC: AuthSyncService.FindByKeycloakId({keycloak_id})
        GRPC->>DB: SELECT * FROM utilisateur WHERE keycloak_id = ?

        alt Utilisateur inexistant (premier login)
            DB-->>GRPC: null
            GRPC-->>GS: NOT_FOUND (code 5)
            GS->>GRPC: UtilisateurService.Create({keycloakId, email, nom, prenom})
            GRPC->>DB: INSERT INTO utilisateur (...)
            DB-->>GRPC: UtilisateurEntity
            GRPC-->>GS: Utilisateur cree
        else Utilisateur existant
            DB-->>GRPC: UtilisateurEntity
            GRPC-->>GS: Utilisateur trouve
        end

        GS->>GRPC: MembreCompteService.ListByUtilisateur({utilisateurId})
        GRPC->>DB: SELECT * FROM membre_compte WHERE utilisateur_id = ?
        DB-->>GRPC: MembreCompte[]
        GRPC-->>GS: {membres: [...]}

        loop Pour chaque membre
            GS->>GRPC: CompteService.Get({id: organisationId})
            GRPC->>DB: SELECT * FROM compte WHERE id = ?
            DB-->>GRPC: CompteEntity
            GS->>GRPC: RoleService.Get({id: roleId})
            GRPC->>DB: SELECT * FROM role WHERE id = ?
            DB-->>GRPC: RoleEntity
        end

        GS-->>GS: Construit AuthMeResponse {utilisateur, organisations[], hasOrganisation}
    end

    Note over U, DB: PHASE 4 : REFRESH TOKEN AUTOMATIQUE

    rect rgb(255, 240, 245)
        NA->>NA: jwt callback appelle shouldRefreshToken(expiresAt)
        Note over NA: Declenche si expiresAt - now <= 60s
        NA->>KC: POST /openid-connect/token<br/>grant_type=refresh_token
        alt Refresh OK
            KC-->>NA: Nouveaux {access_token, refresh_token, expires_in}
            NA-->>NA: Met a jour token dans session
        else Refresh echoue
            KC-->>NA: Erreur (token expire)
            NA-->>NA: token.error = "RefreshAccessTokenError"
            Note over MW: Prochain acces redirige vers /login
        end
    end

---

## 2. Paiement CB Stripe (Checkout Session + PaymentIntent)

**Fichiers sources:**
- `services/service-finance/src/interfaces/grpc/controllers/payments/stripe.controller.ts`
- `services/service-finance/src/infrastructure/psp/stripe/stripe-api.service.ts`
- `services/service-finance/src/infrastructure/security/encryption.service.ts`
- `services/service-finance/src/domain/payments/entities/stripe-account.entity.ts`
- `services/service-finance/src/domain/payments/entities/payment-event.entity.ts`
- `frontend/src/lib/api/index.ts` - ApiClient REST/gRPC

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur CRM
    participant FE as Frontend Next.js
    participant API as ApiClient (REST/gRPC)
    participant GW as Gateway gRPC
    participant SC as StripeController (service-finance)
    participant SA as StripeApiService
    participant ENC as EncryptionService
    participant SE as Stripe API (externe)
    participant EVT as PaymentEvent (audit)
    participant DB as PostgreSQL (finance_db)

    Note over U, DB: PHASE 1 : INITIATION DU PAIEMENT CB

    U->>FE: Clique "Payer par carte"
    FE->>API: createStripeCheckoutSession({societe_id, amount, currency, mode, urls})
    API->>GW: gRPC PaymentService.CreateStripeCheckoutSession
    GW->>SC: createCheckoutSession(data)

    rect rgb(255, 245, 230)
        Note over SC, SA: Resolution du compte Stripe multi-tenant
        SC->>SA: createCheckoutSession(params)
        SA->>SA: getStripeInstance(societeId)
        SA->>DB: SELECT * FROM stripe_account WHERE societe_id AND actif = true
        DB-->>SA: StripeAccountEntity {stripeSecretKey chiffree}
        SA->>ENC: decrypt(stripeSecretKey)
        ENC-->>SA: Cle API Stripe en clair
        SA->>SA: new Stripe(secretKey) puis cache en memoire
    end

    rect rgb(230, 255, 230)
        Note over SA, SE: Appel API Stripe
        SA->>EVT: logApiEvent(API_REQUEST, createCheckoutSession)
        EVT->>DB: INSERT INTO payment_event (provider=STRIPE, type=WEBHOOK_RECEIVED)

        SA->>SE: stripe.checkout.sessions.create({mode, line_items, success_url, cancel_url})

        alt Erreur Stripe
            SE-->>SA: StripeError {type, message}
            SA->>EVT: logApiEvent(API_RESPONSE, error)
            EVT->>DB: INSERT INTO payment_event (error)
            SA-->>SC: throw Error("Stripe createCheckoutSession failed")
            SC-->>GW: gRPC Error
            GW-->>API: Error
            API-->>FE: ApiError
            FE-->>U: Toast erreur "Echec creation paiement"
        else Succes
            SE-->>SA: {id, url, status, payment_status}
            SA->>EVT: logApiEvent(API_RESPONSE, {id, status})
            EVT->>DB: INSERT INTO payment_event (success)
        end
    end

    SA-->>SC: StripeCheckoutSessionResult
    SC-->>GW: {id, url, status, payment_status, customer_id}
    GW-->>API: Response
    API-->>FE: {id, url}
    FE->>FE: window.location.href = checkout_url
    FE-->>U: Redirige vers page Stripe Checkout

    Note over U, DB: PHASE 2 : PAIEMENT SUR STRIPE

    rect rgb(240, 240, 255)
        U->>SE: Saisit numero CB sur Stripe Checkout
        SE-->>SE: 3D Secure si requis
        alt Paiement refuse
            SE-->>U: Affiche erreur (fonds insuffisants, carte bloquee)
            SE->>FE: Redirect vers cancel_url
            FE-->>U: Page annulation
        else Paiement accepte
            SE-->>SE: PaymentIntent.status = succeeded
            SE->>FE: Redirect vers success_url
            FE-->>U: Page confirmation paiement
        end
    end

    Note over U, DB: PHASE 3 : WEBHOOK STRIPE (ASYNCHRONE)

    rect rgb(255, 240, 245)
        SE->>GW: POST /webhooks/stripe {event: checkout.session.completed}
        GW->>DB: INSERT INTO psp_event_inbox (provider=STRIPE, payload)
        Note over DB: Inbox Pattern - Idempotence garantie
        DB-->>GW: Event stocke

        GW->>GW: Traitement asynchrone de l event
        GW->>DB: UPDATE payment_intent SET status = succeeded
        GW->>DB: UPDATE schedule SET statut = paye
        GW->>DB: INSERT INTO payment_audit_log (action=PAYMENT_COMPLETED)
    end

    Note over U, DB: PHASE 4 : CREATION PAYMENT INTENT DIRECT (sans checkout)

    U->>FE: Paiement direct sans redirection
    FE->>API: createStripePaymentIntent({societe_id, amount, currency, confirm: true})
    API->>GW: gRPC PaymentService.CreateStripePaymentIntent
    GW->>SC: createPaymentIntent(data)
    SC->>SA: createPaymentIntent(params)
    SA->>SE: stripe.paymentIntents.create({amount, currency, confirm, automatic_payment_methods})
    SE-->>SA: {id, amount, status, client_secret}
    SA-->>SC: StripePaymentIntentResult
    SC-->>GW: {id, amount, currency, status, client_secret}
    GW-->>API: Response
    API-->>FE: {client_secret}
    FE->>FE: stripe.confirmPayment(client_secret)
    FE-->>U: Resultat du paiement
```

---

## 3. Paiement SEPA GoCardless (Mandat + Prelevement)

**Fichiers sources:**
- `services/service-finance/src/interfaces/grpc/controllers/payments/gocardless.controller.ts`
- `services/service-finance/src/infrastructure/psp/gocardless/gocardless-api.service.ts`
- `services/service-finance/src/domain/payments/entities/gocardless-account.entity.ts`
- `services/service-finance/src/domain/payments/entities/gocardless-mandate.entity.ts`

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur CRM
    participant FE as Frontend Next.js
    participant API as ApiClient
    participant GW as Gateway gRPC
    participant GC as GoCardlessController (service-finance)
    participant GA as GoCardlessApiService
    participant GCX as GoCardless API (externe)
    participant DB as PostgreSQL (finance_db)

    Note over U, DB: PHASE 1 : SETUP MANDAT SEPA

    U->>FE: Clique "Configurer prelevement SEPA"
    FE->>API: setupGoCardlessMandate({societe_id, client_id, scheme: "sepa_core"})
    API->>GW: gRPC PaymentService.SetupGoCardlessMandate
    GW->>GC: setupGoCardlessMandate(data)
    GC->>GA: setupMandate(societe_id, client_id, scheme, success_redirect_url)

    rect rgb(230, 255, 230)
        Note over GA, GCX: Creation du flux de mandat
        GA->>DB: SELECT * FROM gocardless_account WHERE societe_id AND actif
        DB-->>GA: GoCardlessAccountEntity {access_token chiffre}
        GA->>GCX: POST /redirect_flows (scheme=sepa_core, success_redirect_url)
        GCX-->>GA: {id, redirect_url}
    end

    GA-->>GC: {id, mandateId, status, redirect_url}
    GC-->>GW: GoCardlessMandateResponse
    GW-->>API: Response
    API-->>FE: {redirect_url}
    FE-->>U: Redirige vers page GoCardless

    Note over U, DB: PHASE 2 : SIGNATURE MANDAT PAR LE CLIENT

    rect rgb(240, 240, 255)
        U->>GCX: Saisit IBAN + signe le mandat SEPA
        GCX-->>GCX: Validation IBAN + creation mandat
        GCX->>FE: Redirect vers success_redirect_url
        FE-->>U: Confirmation mandat actif
    end

    Note over U, DB: PHASE 3 : CREATION PRELEVEMENT SEPA

    U->>FE: Clique "Prelever client"
    FE->>API: createGoCardlessPayment({societe_id, client_id, amount: 2990, currency: EUR})
    API->>GW: gRPC PaymentService.CreateGoCardlessPayment
    GW->>GC: createGoCardlessPayment(data)
    GC->>GA: createPayment(societe_id, client_id, amount, currency)

    rect rgb(255, 245, 230)
        GA->>DB: SELECT * FROM gocardless_mandate WHERE client_id AND status = active
        DB-->>GA: MandateEntity {mandate_id}
        GA->>GCX: POST /payments {amount, currency, mandate: mandate_id, charge_date}
        GCX-->>GA: {id, status: pending_submission, charge_date}
    end

    GA-->>GC: PaymentResult
    GC-->>GW: {payment_id, amount, status: pending_submission, charge_date}
    GW-->>API: Response
    API-->>FE: Prelevement cree
    FE-->>U: Affiche "Prelevement prevu le {charge_date}"

    Note over U, DB: PHASE 4 : ABONNEMENT SEPA RECURRENT

    U->>FE: Configure abonnement mensuel
    FE->>API: createGoCardlessSubscription({client_id, amount, interval_unit: monthly, interval: 1})
    API->>GW: gRPC PaymentService.CreateGoCardlessSubscription
    GW->>GC: createGoCardlessSubscription(data)
    GC->>GA: createSubscription(societe_id, client_id, amount, currency, monthly, 1)
    GA->>GCX: POST /subscriptions {amount, currency, interval_unit, mandate}
    GCX-->>GA: {id, status: active, next_payment_date}
    GA-->>GC: SubscriptionResult
    GC-->>GW: {subscription_id, status: active, next_payment_date}
    GW-->>API: Response
    API-->>FE: Abonnement actif
    FE-->>U: Affiche "Prochain prelevement le {next_payment_date}"
```

---

## 4. Creation de Compte avec Owner (Onboarding)

**Fichiers sources:**
- `services/service-core/src/infrastructure/grpc/users/compte.controller.ts` - CreateWithOwner
- `services/service-core/src/infrastructure/persistence/typeorm/repositories/users/auth-sync.service.ts`
- `services/service-core/src/infrastructure/persistence/typeorm/repositories/organisations/organisation.service.ts`

```mermaid
sequenceDiagram
    autonumber
    actor U as Nouvel Utilisateur
    participant FE as Frontend Next.js
    participant NA as NextAuth
    participant KC as Keycloak
    participant GW as Gateway gRPC
    participant CC as CompteController (service-core)
    participant AS as AuthSyncService
    participant CS as CompteService
    participant OS as OrganisationService
    participant RS as RoleService
    participant MS as MembreCompteService
    participant DB as PostgreSQL (core_db)

    Note over U, DB: PHASE 1 : INSCRIPTION KEYCLOAK

    U->>FE: Remplit formulaire inscription (email, password, nom)
    FE->>KC: POST /admin/realms/users (creation compte Keycloak)
    KC-->>FE: {sub: keycloak_id}
    FE->>NA: signIn("credentials", {email, password})
    NA->>KC: POST /openid-connect/token grant_type=password
    KC-->>NA: {access_token, refresh_token}
    NA-->>FE: Session creee

    Note over U, DB: PHASE 2 : CREATION COMPTE + ORGANISATION

    FE->>GW: gRPC CompteService.CreateWithOwner({nom, keycloak_user})
    GW->>CC: createWithOwner(data)

    rect rgb(230, 255, 230)
        Note over CC, DB: Etape 1 - Sync utilisateur Keycloak vers DB
        CC->>AS: syncKeycloakUser({sub, email, given_name, family_name})
        AS->>DB: SELECT FROM utilisateur WHERE keycloak_id = sub
        alt Utilisateur existe
            DB-->>AS: UtilisateurEntity
        else Nouveau
            AS->>DB: INSERT INTO utilisateur (keycloak_id, email, nom, prenom)
            DB-->>AS: UtilisateurEntity
        end
        AS-->>CC: owner (UtilisateurEntity)
    end

    rect rgb(255, 245, 230)
        Note over CC, DB: Etape 2 - Creation compte
        CC->>CS: create({nom, etat: actif, createdByUserId: owner.id})
        CS->>DB: INSERT INTO compte (nom, etat, created_by_user_id)
        DB-->>CS: CompteEntity
        CS-->>CC: compte
    end

    rect rgb(240, 240, 255)
        Note over CC, DB: Etape 3 - Creation organisation liee
        CC->>OS: create({id: compte.id, nom, actif: true})
        OS->>DB: INSERT INTO organisation (id, nom, actif)
        alt Echec creation organisation
            DB-->>OS: Error
            OS-->>CC: throw Error
            CC->>CS: delete(compte.id)
            CS->>DB: DELETE FROM compte WHERE id = compte.id
            Note over CC: Rollback - compte supprime
            CC-->>GW: gRPC INTERNAL Error
        else Succes
            DB-->>OS: OrganisationEntity
            OS-->>CC: Organisation creee
        end
    end

    rect rgb(255, 240, 245)
        Note over CC, DB: Etape 4 - Attribution role owner
        CC->>RS: findByCode("owner")
        alt Role owner inexistant
            RS->>DB: SELECT FROM role WHERE code = owner
            DB-->>RS: null
            RS->>RS: create({code: owner, nom: Proprietaire})
            RS->>DB: INSERT INTO role (code, nom, description)
            DB-->>RS: RoleEntity
        else Role existe
            RS->>DB: SELECT FROM role WHERE code = owner
            DB-->>RS: RoleEntity
        end
        RS-->>CC: ownerRole
    end

    rect rgb(230, 255, 230)
        Note over CC, DB: Etape 5 - Ajout membre au compte
        CC->>MS: create({organisationId, utilisateurId, roleId, etat: actif})
        MS->>DB: INSERT INTO membre_compte (organisation_id, utilisateur_id, role_id, etat)
        DB-->>MS: MembreCompteEntity
        MS-->>CC: membre
    end

    CC-->>GW: {compte, owner, membre}
    GW-->>FE: CompteWithOwner Response
    FE-->>U: Redirect vers Dashboard avec organisation active
```

---

## Resume des flux

| # | Diagramme | Participants | Phases |
|---|-----------|-------------|--------|
| 1 | **Auth JWT** | Utilisateur, Page Login, Middleware, NextAuth, Keycloak, auth.server, service-core gRPC, PostgreSQL | Login, Protection routes, Profil SSR, Refresh token |
| 2 | **Paiement CB Stripe** | Utilisateur, Frontend, ApiClient, Gateway gRPC, StripeController, StripeApiService, EncryptionService, Stripe API, PaymentEvent, PostgreSQL | Checkout Session, Paiement 3DS, Webhook async, PaymentIntent direct |
| 3 | **Paiement SEPA GoCardless** | Utilisateur, Frontend, ApiClient, Gateway gRPC, GoCardlessController, GoCardlessApiService, GoCardless API, PostgreSQL | Setup mandat, Signature IBAN, Prelevement, Abonnement recurrent |
| 4 | **Creation Compte** | Utilisateur, Frontend, NextAuth, Keycloak, CompteController, AuthSyncService, CompteService, OrganisationService, RoleService, MembreCompteService, PostgreSQL | Inscription Keycloak, Sync utilisateur, Creation compte+org, Attribution role owner |
