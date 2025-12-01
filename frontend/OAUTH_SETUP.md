# Configuration OAuth2 pour les Emails

Ce guide explique comment configurer l'authentification OAuth2 pour permettre à vos utilisateurs de connecter leurs comptes Gmail et Outlook.

## 📋 Table des matières

1. [Configuration Google (Gmail)](#1-configuration-google-gmail)
2. [Configuration Microsoft (Outlook)](#2-configuration-microsoft-outlook)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Backend API Routes](#4-backend-api-routes)
5. [Utilisation dans l'application](#5-utilisation-dans-lapplication)

---

## 1. Configuration Google (Gmail)

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Donnez un nom à votre projet (ex: "Mon CRM")

### Étape 2 : Activer l'API Gmail

1. Dans le menu, allez à **APIs & Services > Library**
2. Recherchez "Gmail API"
3. Cliquez sur **Enable**

### Étape 3 : Créer des identifiants OAuth 2.0

1. Allez à **APIs & Services > Credentials**
2. Cliquez sur **Create Credentials > OAuth client ID**
3. Si demandé, configurez l'écran de consentement OAuth :
   - Type d'application : **Externe**
   - Nom de l'application : "Mon CRM"
   - Email d'assistance utilisateur : votre email
   - Scopes : Ajoutez `.../auth/gmail.send` et `.../auth/userinfo.email`
   - Domaines autorisés : ajoutez votre domaine

4. Créer l'OAuth client ID :
   - Type d'application : **Application Web**
   - Nom : "CRM Web Client"
   - URIs de redirection autorisés :
     - `http://localhost:3000/api/auth/google/callback` (développement)
     - `https://votredomaine.com/api/auth/google/callback` (production)
   - Origines JavaScript autorisées :
     - `http://localhost:3000` (développement)
     - `https://votredomaine.com` (production)

5. **Copiez le Client ID** (vous en aurez besoin)

### Étape 4 : Scopes requis

Les scopes OAuth nécessaires sont :
- `https://www.googleapis.com/auth/gmail.send` - Pour envoyer des emails
- `https://www.googleapis.com/auth/userinfo.email` - Pour obtenir l'email de l'utilisateur
- `https://www.googleapis.com/auth/userinfo.profile` - Pour obtenir le profil

---

## 2. Configuration Microsoft (Outlook)

### Étape 1 : Enregistrer une application Azure AD

1. Allez sur [Azure Portal](https://portal.azure.com/)
2. Recherchez **Azure Active Directory**
3. Allez à **App registrations > New registration**

### Étape 2 : Configurer l'application

1. Nom : "Mon CRM"
2. Types de comptes pris en charge : **Comptes dans un annuaire organisationnel et comptes Microsoft personnels**
3. URI de redirection :
   - Type : **Web**
   - URI : `http://localhost:3000/api/auth/microsoft/callback`

4. Cliquez sur **Register**

### Étape 3 : Obtenir les identifiants

1. Sur la page de l'application, notez :
   - **Application (client) ID** - C'est votre `MICROSOFT_CLIENT_ID`
   - **Directory (tenant) ID**

2. Allez à **Certificates & secrets**
3. Créez un **New client secret**
4. Copiez la **Value** (vous ne pourrez plus la voir après !)

### Étape 4 : Configurer les permissions API

1. Allez à **API permissions**
2. Cliquez sur **Add a permission**
3. Sélectionnez **Microsoft Graph**
4. Sélectionnez **Delegated permissions**
5. Ajoutez ces permissions :
   - `Mail.Send` - Pour envoyer des emails
   - `User.Read` - Pour lire le profil utilisateur

6. Cliquez sur **Grant admin consent** (si vous êtes admin)

### Étape 5 : Ajouter des URIs de redirection supplémentaires

1. Allez à **Authentication**
2. Ajoutez vos URIs de production :
   - `https://votredomaine.com/api/auth/microsoft/callback`
3. Dans **Implicit grant and hybrid flows**, cochez :
   - ✅ ID tokens
4. Sauvegardez

---

## 3. Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=votre_google_client_id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Microsoft OAuth
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=votre_microsoft_client_id
NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

# En production, utilisez vos vraies URLs
# NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://votredomaine.com/api/auth/google/callback
# NEXT_PUBLIC_MICROSOFT_REDIRECT_URI=https://votredomaine.com/api/auth/microsoft/callback
```

⚠️ **Important** : Ajoutez `.env.local` à votre `.gitignore` pour ne pas commit vos secrets !

---

## 4. Backend API Routes

Vous devez créer ces routes API dans votre backend pour gérer les tokens OAuth :

### 4.1. Échanger le code contre un token

**Google : `/api/auth/google/token`**

```typescript
// app/api/auth/google/token/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  try {
    // Échanger le code contre un access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!, // À ajouter dans .env
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await response.json()

    // Obtenir les infos utilisateur
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const user = await userResponse.json()

    // TODO: Sauvegarder les tokens dans votre base de données
    // associés à l'utilisateur actuel

    return NextResponse.json({
      provider: 'google',
      email: user.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
  }
}
```

**Microsoft : `/api/auth/microsoft/token`**

```typescript
// app/api/auth/microsoft/token/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!, // À ajouter dans .env
        redirect_uri: process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI!,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
      }),
    })

    const tokens = await response.json()

    // Obtenir les infos utilisateur
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const user = await userResponse.json()

    // TODO: Sauvegarder les tokens dans votre base de données

    return NextResponse.json({
      provider: 'microsoft',
      email: user.mail || user.userPrincipalName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 })
  }
}
```

### 4.2. Envoyer un email

**`/api/email/send`**

```typescript
// app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { provider, email, to, subject, body, cc } = await req.json()

  try {
    // TODO: Récupérer l'access token depuis votre base de données
    // pour l'email et le provider spécifiés
    const accessToken = 'RECUPERER_DEPUIS_BDD'

    if (provider === 'google') {
      // Envoyer via Gmail API
      const message = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        `Subject: ${subject}`,
        '',
        body,
      ].filter(Boolean).join('\n')

      const encodedMessage = btoa(unescape(encodeURIComponent(message)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
      })
    } else if (provider === 'microsoft') {
      // Envoyer via Microsoft Graph API
      await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject,
            body: { contentType: 'Text', content: body },
            toRecipients: [{ emailAddress: { address: to } }],
            ...(cc && { ccRecipients: [{ emailAddress: { address: cc } }] }),
          },
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
```

---

## 5. Utilisation dans l'application

### Ajouter le bouton de gestion des comptes

Dans votre page ou composant :

```tsx
import { EmailAccountSettingsDialog } from "@/components/email-account-settings-dialog"

export default function Page() {
  return (
    <div>
      {/* Bouton pour gérer les comptes OAuth */}
      <EmailAccountSettingsDialog />

      {/* Reste de votre interface... */}
    </div>
  )
}
```

### Flux utilisateur

1. L'utilisateur clique sur "Gérer les comptes email"
2. Il clique sur "Connecter" pour Google ou Microsoft
3. Une popup s'ouvre avec l'écran de connexion OAuth
4. L'utilisateur autorise l'application
5. Le compte est ajouté et peut être utilisé pour envoyer des emails

---

## 🔒 Sécurité

### Bonnes pratiques :

1. **Ne jamais exposer les client secrets** dans le frontend
2. **Stocker les tokens de manière sécurisée** (chiffrement dans la BDD)
3. **Implémenter le refresh token** pour renouveler les access tokens expirés
4. **Valider les tokens** avant chaque envoi d'email
5. **Limiter les scopes** au strict nécessaire (juste `send`, pas `read`)
6. **Logger les accès** pour audit

---

## 🐛 Debugging

### Problèmes courants :

**"Invalid redirect_uri"**
- Vérifiez que l'URI de redirection est exactement la même dans Google Cloud / Azure et dans votre `.env.local`

**"Access blocked"**
- Pour Google : Vérifiez que l'écran de consentement est configuré
- Pour Microsoft : Vérifiez que les permissions sont accordées

**"Popup blocked"**
- Demandez à l'utilisateur d'autoriser les popups pour votre site

**Token expiré**
- Implémentez le refresh token pour renouveler automatiquement

---

## 📚 Documentation officielle

- [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API](https://developers.google.com/gmail/api)
- [Microsoft Graph Auth](https://learn.microsoft.com/en-us/graph/auth/)
- [Microsoft Graph Mail](https://learn.microsoft.com/en-us/graph/api/user-sendmail)

---

## ✅ Checklist de déploiement

Avant de passer en production :

- [ ] Secrets configurés dans les variables d'environnement de production
- [ ] URIs de redirection de production ajoutées dans Google Cloud / Azure
- [ ] Écran de consentement OAuth vérifié et approuvé
- [ ] Tokens stockés de manière sécurisée (chiffrés en BDD)
- [ ] Refresh token implémenté
- [ ] Gestion des erreurs et retry logic
- [ ] Logs et monitoring en place
- [ ] Tests avec des comptes réels
