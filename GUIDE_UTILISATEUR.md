# Guide d'utilisation - CRM

Ce guide vous accompagne pas à pas dans l'utilisation de l'application CRM.

---

## Table des matières

1. [Créer un compte et se connecter](#1-créer-un-compte-et-se-connecter)
2. [Créer votre première organisation](#2-créer-votre-première-organisation)
3. [Gestion des membres de l'équipe](#3-gestion-des-membres-de-léquipe)
4. [Gestion des clients](#4-gestion-des-clients)
5. [Gestion des contrats](#5-gestion-des-contrats)
6. [Gestion des commerciaux](#6-gestion-des-commerciaux)
7. [Gestion des commissions](#7-gestion-des-commissions)
8. [Gestion des expéditions](#8-gestion-des-expéditions)
9. [Gestion du catalogue produits](#9-gestion-du-catalogue-produits)
10. [Consulter les statistiques](#10-consulter-les-statistiques)
11. [Connecter vos comptes email](#11-connecter-vos-comptes-email-optionnel)
12. [Changer d'organisation](#12-changer-dorganisation)

---

## 1. Créer un compte et se connecter

### Créer un compte (CREATE)

1. Accédez à la page `/signup`
2. Remplissez le formulaire :

| Champ | Obligatoire | Validation |
|-------|-------------|------------|
| Nom | Oui | Minimum 2 caractères |
| Prénom | Oui | Minimum 2 caractères |
| Email | Oui | Format email valide |
| Mot de passe | Oui | Minimum 8 caractères |

3. Cliquez sur **"S'inscrire"**
4. Vous êtes automatiquement connecté et redirigé vers l'onboarding

### Se connecter (READ)

1. Accédez à la page `/login`
2. Entrez votre **email** et **mot de passe**
3. Cliquez sur **"Se connecter"**

### Réinitialiser le mot de passe (UPDATE)

1. Sur la page `/login`, cliquez sur **"Mot de passe oublié ?"**
2. Entrez votre adresse email
3. Cliquez sur **"Envoyer le lien"**
4. Consultez votre boîte mail et cliquez sur le lien reçu
5. Définissez un nouveau mot de passe

---

## 2. Créer votre première organisation

### Créer une organisation (CREATE)

1. Après l'inscription, vous arrivez sur la page d'onboarding
2. Remplissez le formulaire :

| Champ | Obligatoire | Validation |
|-------|-------------|------------|
| Nom de l'entreprise | Oui | 3 à 50 caractères |

3. Cliquez sur **"Créer l'organisation"**
4. Vous devenez automatiquement **propriétaire (Owner)**
5. Vous êtes redirigé vers le tableau de bord

---

## 3. Gestion des membres de l'équipe

> **Prérequis** : Vous devez être propriétaire (Owner) de l'organisation.

### Consulter les membres (READ)

1. Cliquez sur le **sélecteur d'équipe** en haut de la sidebar
2. Sélectionnez **"Gérer les membres"**
3. Visualisez la liste des membres avec :
   - Nom et email
   - Rôle attribué
   - Date d'arrivée

### Inviter un membre (CREATE)

1. Dans le dialog "Gérer les membres", section **"Inviter un membre"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Options |
|-------|-------------|---------|
| Email | Oui | Format email valide |
| Rôle | Oui | Admin, Member, Viewer |

3. Cliquez sur **"Inviter"**
4. Un lien d'invitation est généré et envoyé par email
5. L'invitation apparaît dans "Invitations en attente"

### Modifier le rôle d'un membre (UPDATE)

1. Dans la liste des membres, cliquez sur le **menu d'actions** (⋮)
2. Sélectionnez **"Modifier le rôle"**
3. Choisissez le nouveau rôle
4. Confirmez la modification

### Retirer un membre (DELETE)

1. Dans la liste des membres, cliquez sur le **menu d'actions** (⋮)
2. Sélectionnez **"Retirer de l'organisation"**
3. Confirmez la suppression

### Annuler une invitation (DELETE)

1. Dans l'onglet "Invitations en attente"
2. Cliquez sur **"Annuler"** à côté de l'invitation
3. L'invitation est invalidée

---

## 4. Gestion des clients

Naviguez vers **Clients** dans la sidebar.

### Consulter la liste des clients (READ)

1. La page affiche tous les clients de l'organisation
2. Utilisez les **filtres** pour rechercher :

| Filtre | Description |
|--------|-------------|
| Nom | Recherche par nom/prénom |
| Email | Recherche par adresse email |
| Téléphone | Recherche par numéro |
| Statut | Filtrer par statut (Actif, Inactif, Prospect...) |
| Société | Filtrer par entreprise |
| IBAN | Recherche par IBAN |
| Source | Filtrer par canal d'acquisition |

3. Cliquez sur un client pour voir sa **fiche détaillée**

### Consulter la fiche client (READ)

La fiche client contient 4 onglets :

**Onglet Vue d'ensemble :**
- Informations personnelles (nom, email, téléphone, date de naissance)
- Informations de conformité (statut KYC, vérification d'identité)
- Informations bancaires (IBAN, BIC)
- Liste des contrats avec historique (timeline)

**Onglet Paiements :**
- Historique de tous les paiements
- Échéancier des paiements à venir
- Statut de chaque paiement

**Onglet Expéditions :**
- Liste des colis envoyés
- Numéro de suivi et statut
- Historique des événements

**Onglet Documents :**
- Liste des documents (GED)
- Téléchargement des fichiers

### Créer un client (CREATE)

1. Cliquez sur le bouton **"+"** (Nouveau client)
2. Remplissez le formulaire :

| Champ | Obligatoire | Options/Validation |
|-------|-------------|-------------------|
| Type de client | Oui | Particulier, Entreprise, Association |
| Nom | Oui | Texte |
| Prénom | Oui | Texte |
| Téléphone | Oui | Format téléphone valide |
| Email | Non | Format email valide |
| Date de naissance | Non | Date (calendrier) |
| Statut | Oui | Liste déroulante des statuts |

3. Cliquez sur **"Créer"**
4. Un **code client unique** est généré automatiquement (ex: CLI-1701234567890)

### Modifier un client (UPDATE)

1. Depuis la fiche client, cliquez sur **"Modifier"** ou l'icône crayon
2. Le formulaire d'édition s'ouvre avec les données actuelles
3. Modifiez les champs souhaités :

| Champ modifiable | Description |
|------------------|-------------|
| Nom / Prénom | Identité du client |
| Email | Adresse email |
| Téléphone | Numéro de contact |
| Date de naissance | Date de naissance |
| Statut | Statut du client |
| Informations bancaires | IBAN, BIC |

4. Cliquez sur **"Enregistrer"**

### Supprimer un client (DELETE)

1. Depuis la fiche client, cliquez sur le **menu d'actions** (⋮)
2. Sélectionnez **"Supprimer le client"**
3. Confirmez la suppression dans la boîte de dialogue
4. Le client est supprimé de la base de données

> **Attention** : La suppression est définitive et supprime également les données associées.

### Gérer les groupes de clients

**Créer un groupe (CREATE) :**
1. Cliquez sur **"Ajouter un groupe"**
2. Entrez le nom du groupe
3. Validez

**Supprimer un groupe (DELETE) :**
1. Cliquez sur l'icône de suppression à côté du groupe
2. Confirmez la suppression

---

## 5. Gestion des contrats

### Consulter les contrats d'un client (READ)

1. Accédez à la fiche du client
2. Dans l'onglet **Vue d'ensemble**, section droite
3. La liste des contrats affiche :
   - Référence du contrat
   - Type de produit
   - Mode de paiement
   - Commercial associé
   - Date de début
   - Statut

4. Cliquez sur un contrat pour voir son **historique** (timeline)

### Créer un contrat (CREATE)

1. Depuis la fiche client, cliquez sur **"Nouveau contrat"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Options/Validation |
|-------|-------------|-------------------|
| Produit | Oui | Sélection dans le catalogue |
| Mode de paiement | Oui | SEPA, Carte bancaire, Chèque, Espèces |
| Commercial | Oui | Liste des commerciaux |
| Date de début | Oui | Date (calendrier) |
| Date de fin | Non | Date (calendrier) |
| Fréquence de paiement | Oui | Mensuel, Trimestriel, Annuel |
| Montant | Oui | Montant en euros |

3. Cliquez sur **"Créer le contrat"**
4. Une **référence unique** est générée automatiquement

### Modifier un contrat (UPDATE)

1. Depuis la liste des contrats, cliquez sur le contrat
2. Cliquez sur **"Modifier"**
3. Modifiez les champs autorisés :

| Champ modifiable | Description |
|------------------|-------------|
| Mode de paiement | Changer le mode de règlement |
| Commercial | Réassigner à un autre commercial |
| Date de fin | Modifier la date de fin |
| Statut | Activer/Suspendre/Résilier |

4. Cliquez sur **"Enregistrer"**

### Résilier un contrat (UPDATE)

1. Depuis le contrat, cliquez sur **"Résilier"**
2. Sélectionnez le motif de résiliation
3. Indiquez la date d'effet
4. Confirmez la résiliation

### Supprimer un contrat (DELETE)

1. Depuis le contrat, cliquez sur le **menu d'actions** (⋮)
2. Sélectionnez **"Supprimer"**
3. Confirmez la suppression

> **Note** : Seuls les contrats en brouillon peuvent être supprimés. Les contrats actifs doivent être résiliés.

---

## 6. Gestion des commerciaux

Naviguez vers **Commerciaux** dans la sidebar.

### Consulter la liste des commerciaux (READ)

1. La page affiche tous les commerciaux
2. Utilisez les **filtres** :

| Filtre | Description |
|--------|-------------|
| Nom | Recherche par nom |
| SIREN | Recherche par numéro SIREN |
| Email | Recherche par email |

3. Le tableau affiche :
   - Nom et prénom
   - Email de contact
   - Numéro SIREN
   - Statut (Actif/Inactif)
   - Taux de commission

### Créer un commercial (CREATE)

1. Cliquez sur **"Nouveau commercial"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Validation |
|-------|-------------|------------|
| Nom | Oui | Texte |
| Prénom | Oui | Texte |
| Email | Oui | Format email valide |
| Téléphone | Non | Format téléphone |
| SIREN | Non | 9 chiffres |
| Adresse | Non | Texte |
| Taux de commission | Non | Pourcentage |
| Statut | Oui | Actif, Inactif |

3. Cliquez sur **"Créer"**

### Modifier un commercial (UPDATE)

1. Cliquez sur le commercial dans la liste
2. Cliquez sur **"Modifier"**
3. Modifiez les informations souhaitées
4. Cliquez sur **"Enregistrer"**

### Désactiver un commercial (UPDATE)

1. Cliquez sur le commercial
2. Cliquez sur **"Désactiver"**
3. Le commercial passe en statut "Inactif"
4. Il n'apparaît plus dans les listes de sélection

### Supprimer un commercial (DELETE)

1. Cliquez sur le **menu d'actions** (⋮)
2. Sélectionnez **"Supprimer"**
3. Confirmez la suppression

> **Note** : Un commercial avec des contrats actifs ne peut pas être supprimé.

---

## 7. Gestion des commissions

Naviguez vers **Commissions** dans la sidebar.

### Vue d'ensemble (KPIs)

| Indicateur | Description |
|------------|-------------|
| Total Brut | Montant total des commissions |
| Total Reprises | Montant des annulations |
| Total Acomptes | Montant des avances versées |
| Net à Payer | Montant net dû |
| Nombre de Lignes | Nombre de lignes de commission |

---

### Onglet Commissions

#### Consulter les commissions (READ)

1. Visualisez la liste de toutes les commissions
2. Appliquez les **filtres** :

| Filtre | Description |
|--------|-------------|
| Période | Plage de dates |
| Produit | Type de produit |
| Société | Entreprise concernée |
| Apporteur | Apporteur d'affaires |
| Statut | État de la commission |
| Profil | Type de profil |

3. Cliquez sur une ligne pour voir le **détail**

#### Valider des commissions (UPDATE)

1. Cochez les commissions à valider (cases à cocher)
2. Cliquez sur **"Valider la sélection"**
3. Un **bordereau** est automatiquement généré
4. Les commissions passent en statut "Validée"

---

### Onglet Bordereaux

#### Consulter les bordereaux (READ)

Le tableau affiche :
- Référence du bordereau
- Nom de l'apporteur
- Période couverte
- Nombre de commissions
- Montant total
- Statut (Brouillon, Validé)
- Date de création

#### Créer un bordereau (CREATE)

1. Sélectionnez des commissions dans l'onglet "Commissions"
2. Cliquez sur **"Valider la sélection"**
3. Le bordereau est créé automatiquement en statut "Brouillon"

#### Valider un bordereau (UPDATE)

1. Cliquez sur le bordereau
2. Cliquez sur **"Valider"**
3. Le bordereau passe en statut "Validé"
4. Les commissions associées sont verrouillées

#### Exporter un bordereau (READ)

1. Cliquez sur le bordereau
2. Cliquez sur **"Exporter PDF"** ou **"Exporter Excel"**
3. Le fichier est téléchargé

---

### Onglet Reprises

#### Consulter les reprises (READ)

Le tableau affiche :
- Référence de la reprise
- Type de reprise
- Montant
- Commission(s) concernée(s)
- Motif
- Statut (En attente, Validée, Annulée)

#### Créer une reprise (CREATE)

1. Cliquez sur **"Nouvelle reprise"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Commission | Oui | Sélection de la commission à reprendre |
| Type | Oui | Annulation, Correction, Régularisation |
| Montant | Oui | Montant de la reprise |
| Motif | Oui | Raison de la reprise |

3. Cliquez sur **"Créer"**

#### Valider une reprise (UPDATE)

1. Cliquez sur la reprise
2. Cliquez sur **"Valider"**
3. Le montant est déduit des commissions

#### Annuler une reprise (UPDATE)

1. Cliquez sur la reprise
2. Cliquez sur **"Annuler"**
3. Entrez le motif d'annulation
4. Confirmez

---

### Onglet Apporteurs

#### Consulter les apporteurs (READ)

Le tableau affiche :
- Nom de l'apporteur
- Type d'apporteur
- Email
- Téléphone
- Statut (Actif/Inactif)

#### Créer un apporteur (CREATE)

1. Cliquez sur **"Nouvel apporteur"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Nom | Oui | Nom de l'apporteur |
| Type | Oui | Type d'apporteur |
| Email | Oui | Adresse email |
| Téléphone | Non | Numéro de téléphone |
| SIRET | Non | Numéro SIRET |
| Adresse | Non | Adresse postale |

3. Cliquez sur **"Créer"**

#### Modifier un apporteur (UPDATE)

1. Cliquez sur l'apporteur
2. Cliquez sur **"Modifier"**
3. Modifiez les informations
4. Cliquez sur **"Enregistrer"**

#### Activer/Désactiver un apporteur (UPDATE)

1. Cliquez sur le toggle de statut
2. L'apporteur passe en Actif ou Inactif

---

### Onglet Barèmes

#### Consulter les barèmes (READ)

Le tableau affiche :
- Type de produit
- Type d'apporteur
- Base de calcul
- Taux/Pourcentage
- Paliers (si applicable)
- Durée de reprise
- Statut

#### Créer un barème (CREATE)

1. Cliquez sur **"Nouveau barème"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Produit | Oui | Type de produit concerné |
| Type d'apporteur | Oui | Catégorie d'apporteur |
| Base de calcul | Oui | CA, Nombre de contrats, etc. |
| Taux | Oui | Pourcentage de commission |
| Paliers | Non | Paliers de volume (optionnel) |
| Durée de reprise | Non | Période de reprise en mois |

3. Cliquez sur **"Créer"**

#### Modifier un barème (UPDATE)

1. Cliquez sur le barème
2. Cliquez sur **"Modifier"**
3. Modifiez les paramètres
4. Cliquez sur **"Enregistrer"**

#### Supprimer un barème (DELETE)

1. Cliquez sur le **menu d'actions** (⋮)
2. Sélectionnez **"Supprimer"**
3. Confirmez la suppression

> **Note** : Un barème utilisé par des commissions actives ne peut pas être supprimé.

---

## 8. Gestion des expéditions

Naviguez vers **Expéditions** dans la sidebar.

### Vue d'ensemble (KPIs)

| Indicateur | Description |
|------------|-------------|
| Total | Nombre total d'expéditions |
| Livrées | Nombre de colis livrés |
| En transit | Colis en cours d'acheminement |
| En retard | Colis avec retard de livraison |

### Consulter les expéditions (READ)

1. Visualisez la liste de tous les envois
2. Appliquez les **filtres** :

| Filtre | Description |
|--------|-------------|
| Recherche | N° commande, tracking, client, société |
| Société | Filtrer par entreprise |
| Produit | Filtrer par type de produit |
| Statut | En attente, En transit, Livré, etc. |

3. Le tableau affiche :
   - N° de commande
   - N° de tracking
   - Nom du client
   - Produit
   - Transporteur
   - Statut
   - Destination
   - Poids
   - Dates (création, expédition, livraison estimée/réelle)

### Statuts disponibles

| Statut | Description |
|--------|-------------|
| En attente | Commande reçue, pas encore traitée |
| Préparation | Colis en cours de préparation |
| Expédié | Colis remis au transporteur |
| En transit | Colis en cours d'acheminement |
| En livraison | Colis en cours de livraison |
| Livré | Colis livré au destinataire |
| Retard | Colis en retard |
| Annulé | Expédition annulée |

### Créer une expédition (CREATE)

1. Cliquez sur **"Nouvelle expédition"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Client | Oui | Sélection du destinataire |
| Produit | Oui | Article à expédier |
| Transporteur | Oui | Colissimo, Chronopost, UPS, etc. |
| Adresse de livraison | Oui | Adresse complète |
| Poids | Non | Poids en kg |
| Instructions | Non | Instructions de livraison |

3. Cliquez sur **"Créer l'expédition"**

### Suivre une expédition (READ)

1. Cliquez sur **"Suivre"** sur la ligne de l'expédition
2. Un panneau latéral s'ouvre avec :
   - **Timeline** des événements
   - Date et heure de chaque étape
   - Localisation actuelle
   - Date de livraison estimée

### Modifier une expédition (UPDATE)

1. Cliquez sur l'expédition
2. Cliquez sur **"Modifier"**
3. Modifiez les champs autorisés (selon le statut)
4. Cliquez sur **"Enregistrer"**

### Marquer comme livré (UPDATE)

1. Cliquez sur **"Marquer comme livré"**
2. Confirmez la livraison
3. Le statut passe à "Livré"
4. La date de livraison est enregistrée

### Réessayer une expédition (UPDATE)

1. Pour une expédition échouée, cliquez sur **"Réessayer"**
2. L'expédition est relancée

### Annuler une expédition (UPDATE)

1. Cliquez sur **"Annuler"**
2. Entrez le motif d'annulation
3. Confirmez
4. Le statut passe à "Annulé"

### Exporter les expéditions (READ)

1. Cliquez sur **"Exporter CSV"**
2. Le fichier contenant les expéditions filtrées est téléchargé

---

## 9. Gestion du catalogue produits

Naviguez vers **Catalogue** dans la sidebar.

### Consulter le catalogue (READ)

1. La sidebar gauche affiche les **catégories** :
   - Tous les produits
   - Assistance
   - Bleulec
   - Décès toutes causes
   - Dépendance
   - GAV (Garantie accidents de la vie)
   - MRH (Multirisques habitation)
   - Obsèques
   - Protection juridique
   - Santé

2. Cliquez sur une catégorie pour filtrer

3. Le tableau affiche :
   - Référence (SKU)
   - Nom du produit
   - Catégorie
   - Prix de base
   - Description/Couverture

### Consulter le détail d'un produit (READ)

1. Cliquez sur un produit
2. Le panneau de détail affiche :
   - Image du produit
   - Description complète
   - Informations de couverture
   - Grille tarifaire
   - Taux de commission associés

### Créer un produit (CREATE)

1. Cliquez sur **"Nouveau produit"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Nom | Oui | Nom du produit |
| Référence (SKU) | Oui | Code unique |
| Catégorie | Oui | Catégorie du produit |
| Description | Non | Description détaillée |
| Prix de base | Oui | Prix en euros |
| Image | Non | Image du produit |
| Couvertures | Non | Liste des garanties |

3. Cliquez sur **"Créer"**

### Modifier un produit (UPDATE)

1. Cliquez sur le produit
2. Cliquez sur **"Modifier"**
3. Modifiez les informations
4. Cliquez sur **"Enregistrer"**

### Supprimer un produit (DELETE)

1. Cliquez sur le **menu d'actions** (⋮)
2. Sélectionnez **"Supprimer"**
3. Confirmez la suppression

> **Note** : Un produit lié à des contrats actifs ne peut pas être supprimé.

---

## 10. Consulter les statistiques

Naviguez vers **Statistiques** dans la sidebar.

### Filtres communs

| Filtre | Options |
|--------|---------|
| Période rapide | Mois courant, Trimestre courant, Année courante |
| Plage de dates | Sélection personnalisée |

### Vue Direction

Pour les managers et dirigeants :

**KPIs affichés :**
| Indicateur | Description |
|------------|-------------|
| Contrats | Nombre total de contrats |
| CA | Chiffre d'affaires |
| Impayés | Montant des impayés |
| Alertes | Nombre d'alertes actives |

**Graphiques :**
- Évolution du CA dans le temps (courbe)
- Répartition par produit (camembert)
- Panel d'alertes

**Tableau détaillé :**
- CA par société
- Nombre de contrats par société
- Nombre de clients par société

### Vue Commerciale

Pour le suivi des performances :

**Classements :**
- Top commerciaux par **nombre de ventes**
- Top commerciaux par **chiffre d'affaires**
- Top commerciaux par **taux de conversion**

### Vue Risques & Qualité

Pour le contrôle qualité :

**KPIs :**
| Indicateur | Description |
|------------|-------------|
| En attente CQ | Contrats en attente de contrôle |
| Taux de rejet | Pourcentage de rejets |
| Impayés | Montant total des impayés |

---

## 11. Connecter vos comptes email (optionnel)

### Consulter les comptes connectés (READ)

1. Cliquez sur votre **profil** en bas de la sidebar
2. Sélectionnez **"Comptes Email"**
3. Visualisez la liste des comptes avec :
   - Adresse email
   - Fournisseur (Google, Microsoft)
   - Date de connexion
   - Statut

### Connecter un compte (CREATE)

1. Cliquez sur **"Connecter"** à côté du fournisseur :
   - **Google** (Gmail)
   - **Microsoft** (Outlook/Office 365)
2. Une fenêtre OAuth s'ouvre
3. Connectez-vous avec votre compte
4. Autorisez l'accès à l'application
5. Le compte apparaît dans la liste

### Envoyer un email (CREATE)

1. Depuis la **fiche client**, cliquez sur l'**icône email**
2. Sélectionnez le **compte d'envoi**
3. Rédigez votre message :

| Champ | Description |
|-------|-------------|
| De | Compte d'envoi sélectionné |
| À | Pré-rempli avec l'email du client |
| Cc | Destinataires en copie (optionnel) |
| Objet | Objet du message |
| Message | Corps de l'email |

4. Cliquez sur **"Envoyer"**

### Déconnecter un compte (DELETE)

1. Accédez à **"Comptes Email"**
2. Cliquez sur **"Déconnecter"** à côté du compte
3. Confirmez la déconnexion
4. Les accès sont révoqués

---

## 12. Changer d'organisation

### Consulter vos organisations (READ)

1. Cliquez sur le **sélecteur d'équipe** en haut de la sidebar
2. La liste de vos organisations s'affiche avec :
   - Nom de l'organisation
   - Statut (Actif/Inactif)

### Changer d'organisation active (UPDATE)

1. Cliquez sur l'organisation souhaitée
2. L'application se met à jour avec les données de cette organisation
3. Toutes les données affichées concernent la nouvelle organisation

### Créer une nouvelle organisation (CREATE)

1. Cliquez sur le sélecteur d'équipe
2. Sélectionnez **"Créer une organisation"**
3. Entrez le nom de la nouvelle organisation
4. Cliquez sur **"Créer"**
5. Vous devenez propriétaire de cette organisation

---

## Récapitulatif des opérations CRUD par entité

| Entité | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Utilisateur | Inscription | Profil | Mot de passe | - |
| Organisation | Onboarding | Liste | - | - |
| Membre | Invitation | Liste | Rôle | Retrait |
| Client | Formulaire | Liste/Fiche | Formulaire | Suppression |
| Groupe client | Bouton + | Onglets | - | Icône X |
| Contrat | Formulaire | Liste/Détail | Formulaire | Suppression* |
| Commercial | Formulaire | Liste/Fiche | Formulaire | Suppression* |
| Commission | Auto (contrat) | Liste/Détail | Validation | - |
| Bordereau | Auto (validation) | Liste | Validation | - |
| Reprise | Formulaire | Liste | Validation/Annulation | - |
| Apporteur | Formulaire | Liste | Formulaire | - |
| Barème | Formulaire | Liste | Formulaire | Suppression* |
| Expédition | Formulaire | Liste/Suivi | Statut | Annulation |
| Produit | Formulaire | Catalogue | Formulaire | Suppression* |
| Compte email | OAuth | Liste | - | Déconnexion |

> *Suppression conditionnelle : impossible si des données liées existent.

---

## Rôles et permissions

| Rôle | Create | Read | Update | Delete | Gérer membres |
|------|--------|------|--------|--------|---------------|
| **Owner** | Tout | Tout | Tout | Tout | Oui |
| **Admin** | Tout | Tout | Tout | Limité | Non |
| **Member** | Limité | Tout | Limité | Non | Non |
| **Viewer** | Non | Tout | Non | Non | Non |

---

## Raccourcis et astuces

- **Recherche rapide** : Utilisez la barre de recherche du dashboard
- **Filtres combinés** : Combinez plusieurs filtres pour affiner les résultats
- **Export** : La plupart des tableaux peuvent être exportés en CSV ou Excel
- **Mode sombre** : Activez le thème sombre depuis les paramètres
- **Raccourcis clavier** :
  - `Échap` : Fermer un dialog
  - `Entrée` : Valider un formulaire

---

## Support

Pour toute question ou problème, contactez le support technique.
