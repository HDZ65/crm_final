# Guide OAuth2 - Connexion des Boîtes Mail

Ce guide explique comment utiliser le système OAuth2 pour connecter les boîtes mail Gmail et Microsoft (Outlook, Office 365, domaines personnalisés) au CRM.

## Vue d'ensemble

Le système OAuth2 permet aux utilisateurs de connecter leurs comptes email de manière sécurisée sans stocker directement leurs mots de passe.

**Providers supportés :**
- ✅ **Google Gmail** - Comptes `@gmail.com`
- ✅ **Microsoft Outlook** - Comptes personnels (`@outlook.com`, `@hotmail.com`, `@live.fr`)
- ✅ **Microsoft 365 / Office 365** - Domaines personnalisés d'entreprise (ex: `@finanssor.fr`, `@votre-entreprise.com`)

Le flux OAuth2 se déroule en 3 étapes :

1. **Obtenir l'URL d'autorisation** - Générer l'URL vers laquelle rediriger l'utilisateur
2. **Échanger le code** - Après autorisation, échanger le code contre des tokens d'accès
3. **Rafraîchir les tokens** - Renouveler automatiquement les tokens expirés

## Configuration préalable

### Google Cloud Console

1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com/)
2. Activer l'API Gmail
3. Créer des identifiants OAuth 2.0 :
   - Type : Application Web
   - URI de redirection autorisée : `http://localhost:3000/oauth/callback/google` (dev)
   - Noter le `Client ID` et `Client Secret`

### Microsoft Azure Portal

#### Pour Outlook personnel (`@outlook.com`, `@hotmail.com`, `@live.fr`)

1. Créer une application sur [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Configurer les autorisations API :
   - Microsoft Graph : `Mail.Send`, `Mail.Read`, `User.Read`, `offline_access`
   - Type : Délégué
3. Créer un secret client
4. Ajouter l'URI de redirection : `http://localhost:3000/oauth/callback/microsoft`
5. Noter l'`Application (client) ID` et la valeur du secret

#### Pour Microsoft 365 / Office 365 avec domaine personnalisé (ex: `@finanssor.fr`)

**⚠️ Important :** La configuration doit être faite par un **administrateur Microsoft 365** de votre organisation.

**Étape 1 : Accès administrateur**
1. L'administrateur IT doit se connecter au [Azure Portal](https://portal.azure.com) avec son compte admin
2. Aller dans **Azure Active Directory** → **App registrations**

**Étape 2 : Créer l'application**
1. Cliquer sur **New registration**
2. Nom : `CRM Mailbox Integration` (ou autre nom)
3. **Supported account types** :
   - Choisir **"Accounts in this organizational directory only"** pour votre entreprise uniquement
   - OU **"Accounts in any organizational directory"** pour multi-tenant
4. **Redirect URI** :
   - Plateforme : Web
   - URI : `http://localhost:3000/oauth/callback/microsoft` (dev) ou `https://votre-crm.com/oauth/callback/microsoft` (prod)
5. Cliquer **Register**

**Étape 3 : Configurer les permissions API**
1. Dans le menu de gauche : **API permissions**
2. Cliquer **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Ajouter les permissions :
   - ✅ `Mail.Send` - Envoyer des emails
   - ✅ `Mail.Read` - Lire les emails
   - ✅ `User.Read` - Lire le profil utilisateur
   - ✅ `offline_access` - Accès hors ligne (refresh tokens)
4. Cliquer **Add permissions**
5. **Important** : Cliquer sur **Grant admin consent for [Votre Organisation]** (requis pour que ça fonctionne)

**Étape 4 : Créer un secret client**
1. Dans le menu de gauche : **Certificates & secrets**
2. Onglet **Client secrets** → **New client secret**
3. Description : `CRM OAuth Secret`
4. Expiration : 24 mois (ou selon votre politique de sécurité)
5. Cliquer **Add**
6. **⚠️ COPIER LA VALEUR IMMÉDIATEMENT** (elle ne sera plus visible après)

**Étape 5 : Noter les informations**
1. Revenir à **Overview**
2. Noter :
   - **Application (client) ID** : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Directory (tenant) ID** : `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`
   - **Client secret value** : La valeur copiée à l'étape 4

**Étape 6 : Configuration dans le CRM**
Utiliser ces valeurs dans votre fichier `.env` :
```env
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=la-valeur-du-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/oauth/callback/microsoft
```

**Test de connexion :**
- Les utilisateurs pourront se connecter avec leur email `@finanssor.fr` (ou votre domaine)
- L'authentification se fera via `login.microsoftonline.com`
- Le consentement admin permet à tous les utilisateurs de l'organisation d'utiliser l'app

## Flux OAuth2

### Étape 1 : Obtenir l'URL d'autorisation

**Endpoint :** `POST /oauth/authorization-url`

**Body :**
```json
{
  "provider": "google",  // ou "microsoft"
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/oauth/callback/google"
}
```

**Réponse :**
```json
{
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "provider": "google"
}
```

**Action :** Rediriger l'utilisateur vers `authorizationUrl` dans le navigateur.

### Étape 2 : Échanger le code d'autorisation

Après que l'utilisateur ait autorisé l'accès, il sera redirigé vers votre `redirectUri` avec un paramètre `code` dans l'URL :

```
http://localhost:3000/oauth/callback/google?code=4/0AY0e-g7...
```

**Frontend** : Capturer ce code et l'envoyer au backend.

**Endpoint :** `POST /oauth/exchange-code`

**Body :**
```json
{
  "provider": "google",
  "code": "4/0AY0e-g7...",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/oauth/callback/google",
  "utilisateurId": "uuid-de-l-utilisateur"
}
```

**Réponse :**
```json
{
  "accessToken": "ya29.a0AfH6...",
  "refreshToken": "1//0gZx...",
  "expiryDate": "2025-01-25T15:30:00.000Z",
  "userEmail": "user@gmail.com",
  "userName": "John Doe",
  "provider": "google"
}
```

**Action automatique :** Une boîte mail est créée automatiquement dans la base de données avec ces informations.

### Étape 3 : Rafraîchir le token

Lorsque le token expire, le backend peut le rafraîchir automatiquement.

**Endpoint :** `POST /oauth/refresh-token/:boiteMailId`

**Paramètres :**
- `boiteMailId` : L'ID de la boîte mail à rafraîchir

**Réponse :**
```json
{
  "accessToken": "ya29.a0AfH6...",
  "refreshToken": "1//0gZx...",
  "expiryDate": "2025-01-25T16:30:00.000Z",
  "userEmail": "",
  "userName": "",
  "provider": ""
}
```

## API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/oauth/authorization-url` | POST | Génère l'URL d'autorisation OAuth2 |
| `/oauth/exchange-code` | POST | Échange le code d'autorisation contre des tokens |
| `/oauth/refresh-token/:id` | POST | Rafraîchit le token d'accès d'une boîte mail |
| `/oauth/callback/google` | GET | Placeholder pour callback Google (géré par le frontend) |
| `/oauth/callback/microsoft` | GET | Placeholder pour callback Microsoft (géré par le frontend) |

## Intégration Frontend (Exemple React)

```typescript
// 1. Demander l'URL d'autorisation
const getAuthUrl = async (provider: 'google' | 'microsoft') => {
  const response = await fetch('/oauth/authorization-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${window.location.origin}/oauth/callback/${provider}`
    })
  });

  const { authorizationUrl } = await response.json();

  // Rediriger vers Google/Microsoft
  window.location.href = authorizationUrl;
};

// 2. Page de callback (ex: /oauth/callback/google)
const OAuthCallback = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      exchangeCode(code);
    }
  }, []);

  const exchangeCode = async (code: string) => {
    const response = await fetch('/oauth/exchange-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        code,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${window.location.origin}/oauth/callback/google`,
        utilisateurId: currentUser.id
      })
    });

    const result = await response.json();
    console.log('Boîte mail connectée:', result);

    // Rediriger vers la page des boîtes mail
    navigate('/settings/mailboxes');
  };

  return <div>Connexion en cours...</div>;
};
```

## Gestion automatique du rafraîchissement

Vous pouvez créer un service backend qui vérifie régulièrement les tokens expirés et les rafraîchit :

```typescript
// À implémenter dans un CRON job ou scheduler
async function refreshExpiredTokens() {
  // Récupérer toutes les boîtes mail OAuth2
  const boitesMail = await boiteMailRepository.findAll();

  for (const boiteMail of boitesMail) {
    if (boiteMail.typeConnexion === 'oauth2' && boiteMail.isTokenExpired()) {
      try {
        await refreshOAuthTokenUseCase.execute(boiteMail.id);
        console.log(`Token rafraîchi pour ${boiteMail.adresseEmail}`);
      } catch (error) {
        console.error(`Erreur rafraîchissement ${boiteMail.adresseEmail}:`, error);
      }
    }
  }
}
```

## Sécurité

### En développement

Les credentials OAuth2 sont actuellement stockés en base de données. Pour le développement, c'est acceptable.

### En production

**⚠️ IMPORTANT** : Vous DEVEZ implémenter le chiffrement des données sensibles :

1. **Chiffrer les champs sensibles** :
   - `clientSecret`
   - `refreshToken`
   - `accessToken`

2. **Utiliser un service de gestion de clés** :
   - AWS KMS
   - Azure Key Vault
   - Google Cloud KMS
   - HashiCorp Vault

3. **Ne jamais exposer ces champs dans les réponses API** (déjà fait dans `BoiteMailDto`)

4. **Utiliser HTTPS** en production pour toutes les communications

## Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback/google

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/oauth/callback/microsoft
```

## Limites et considérations

### Google
- Les refresh tokens ne sont délivrés que lors du premier consentement
- Utilisez `prompt: 'consent'` pour forcer l'obtention d'un refresh token
- Les tokens expirent après 1 heure
- Limite de 100 refresh tokens par compte Google

### Microsoft (Outlook personnel)
- MSAL gère automatiquement le cache des tokens
- Le refresh token n'est pas directement accessible
- Les tokens expirent généralement après 1 heure
- Le refresh est géré par la librairie MSAL
- Les comptes personnels (`@outlook.com`, `@hotmail.com`, `@live.fr`) peuvent s'authentifier directement

### Microsoft 365 / Office 365 (domaines personnalisés)
- **Configuration par l'administrateur requise** - Un admin Microsoft 365 doit créer l'application Azure AD
- **Consentement administrateur obligatoire** - L'admin doit accorder les permissions pour toute l'organisation
- **Authentification multi-tenant** - Peut supporter plusieurs organisations si configuré
- **Domaines personnalisés supportés** - Fonctionne avec `@finanssor.fr`, `@votre-entreprise.com`, etc.
- **Authentification via login.microsoftonline.com** - Utilise l'authentification Azure AD de l'entreprise

## Swagger Documentation

La documentation complète de l'API OAuth2 est disponible sur :
```
http://localhost:3000/docs#/OAuth2
```

## Support

Pour plus d'informations :
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
