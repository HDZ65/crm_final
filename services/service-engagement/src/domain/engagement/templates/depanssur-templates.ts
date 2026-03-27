/**
 * Notification Templates for Depanssur Domain
 * Used by NATS event handlers to send emails and SMS
 */

export interface DepanssurEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface DepanssurSMSTemplate {
  message: string;
}

/**
 * Email Templates
 */

export const DEPANSSUR_EMAIL_BIENVENUE: DepanssurEmailTemplate = {
  subject: 'Bienvenue à votre abonnement Depanssur {{planType}}',
  html: `
    <h2>Bienvenue chez Depanssur !</h2>
    <p>Bonjour {{clientName}},</p>
    <p>Nous sommes ravis de vous compter parmi nos abonnés.</p>
    <p><strong>Votre abonnement :</strong></p>
    <ul>
      <li>Plan : {{planType}}</li>
      <li>Prix : {{prixTtc}} € TTC / {{periodicite}}</li>
      <li>Date d'effet : {{dateEffet}}</li>
      <li>Période d'attente : {{periodeAttente}} jours</li>
    </ul>
    <p>À partir du {{dateFinCarence}}, vous pourrez déclarer vos dossiers.</p>
    <p>Cordialement,<br>L'équipe Depanssur</p>
    <p style="font-size:11px;color:#999;margin-top:30px;">
      <a href="{{unsubscribeLink}}">Se désabonner</a>
    </p>
  `,
  text: `Bienvenue chez Depanssur !

Bonjour {{clientName}},

Nous sommes ravis de vous compter parmi nos abonnés.

Votre abonnement :
- Plan : {{planType}}
- Prix : {{prixTtc}} € TTC / {{periodicite}}
- Date d'effet : {{dateEffet}}
- Période d'attente : {{periodeAttente}} jours

À partir du {{dateFinCarence}}, vous pourrez déclarer vos dossiers.

Cordialement,
L'équipe Depanssur

Se désabonner : {{unsubscribeLink}}`
};

export const DEPANSSUR_EMAIL_CONFIRMATION_ACTIVATION: DepanssurEmailTemplate = {
  subject: 'Votre abonnement Depanssur est maintenant actif',
  html: `
    <h2>Votre période d'attente est terminée</h2>
    <p>Bonjour {{clientName}},</p>
    <p>Bonne nouvelle ! Votre abonnement Depanssur {{planType}} est maintenant pleinement actif.</p>
    <p>Vous pouvez dès à présent déclarer vos dossiers d'intervention.</p>
    <p><strong>Vos garanties :</strong></p>
    <ul>
      <li>Plafond par intervention : {{plafondParIntervention}} €</li>
      <li>Plafond annuel : {{plafondAnnuel}} €</li>
      <li>Nombre d'interventions max : {{nbInterventionsMax}}</li>
    </ul>
    <p>Cordialement,<br>L'équipe Depanssur</p>
    <p style="font-size:11px;color:#999;margin-top:30px;">
      <a href="{{unsubscribeLink}}">Se désabonner</a>
    </p>
  `,
  text: `Votre période d'attente est terminée

Bonjour {{clientName}},

Bonne nouvelle ! Votre abonnement Depanssur {{planType}} est maintenant pleinement actif.

Vous pouvez dès à présent déclarer vos dossiers d'intervention.

Vos garanties :
- Plafond par intervention : {{plafondParIntervention}} €
- Plafond annuel : {{plafondAnnuel}} €
- Nombre d'interventions max : {{nbInterventionsMax}}

Cordialement,
L'équipe Depanssur

Se désabonner : {{unsubscribeLink}}`
};

export const DEPANSSUR_EMAIL_ALERTE_PLAFOND_PROCHE: DepanssurEmailTemplate = {
  subject: 'Alerte : Vous approchez de votre plafond annuel',
  html: `
    <h2>⚠️ Alerte plafond</h2>
    <p>Bonjour {{clientName}},</p>
    <p>Nous vous informons que vous avez atteint <strong>{{pourcentageUtilise}}%</strong> de votre plafond annuel.</p>
    <p><strong>Utilisation actuelle :</strong></p>
    <ul>
      <li>Montant consommé : {{montantUtilise}} € sur {{plafondAnnuel}} €</li>
      <li>Interventions : {{nbInterventionsUtilisees}} sur {{nbInterventionsMax}}</li>
    </ul>
    <p>Il vous reste <strong>{{montantRestant}} €</strong> et <strong>{{nbInterventionsRestantes}} interventions</strong> disponibles.</p>
    <p>Cordialement,<br>L'équipe Depanssur</p>
    <p style="font-size:11px;color:#999;margin-top:30px;">
      <a href="{{unsubscribeLink}}">Se désabonner</a>
    </p>
  `,
  text: `⚠️ Alerte plafond

Bonjour {{clientName}},

Nous vous informons que vous avez atteint {{pourcentageUtilise}}% de votre plafond annuel.

Utilisation actuelle :
- Montant consommé : {{montantUtilise}} € sur {{plafondAnnuel}} €
- Interventions : {{nbInterventionsUtilisees}} sur {{nbInterventionsMax}}

Il vous reste {{montantRestant}} € et {{nbInterventionsRestantes}} interventions disponibles.

Cordialement,
L'équipe Depanssur

Se désabonner : {{unsubscribeLink}}`
};

export const DEPANSSUR_EMAIL_DOSSIER_ENREGISTRE: DepanssurEmailTemplate = {
  subject: 'Votre dossier {{referenceDossier}} a été enregistré',
  html: `
    <h2>Dossier enregistré</h2>
    <p>Bonjour {{clientName}},</p>
    <p>Nous avons bien enregistré votre dossier d'intervention.</p>
    <p><strong>Référence :</strong> {{referenceDossier}}</p>
    <p><strong>Type :</strong> {{typeDossier}}</p>
    <p><strong>Date d'ouverture :</strong> {{dateOuverture}}</p>
    <p>Votre dossier est en cours d'analyse. Nous reviendrons vers vous sous 48h.</p>
    <p>Cordialement,<br>L'équipe Depanssur</p>
    <p style="font-size:11px;color:#999;margin-top:30px;">
      <a href="{{unsubscribeLink}}">Se désabonner</a>
    </p>
  `,
  text: `Dossier enregistré

Bonjour {{clientName}},

Nous avons bien enregistré votre dossier d'intervention.

Référence : {{referenceDossier}}
Type : {{typeDossier}}
Date d'ouverture : {{dateOuverture}}

Votre dossier est en cours d'analyse. Nous reviendrons vers vous sous 48h.

Cordialement,
L'équipe Depanssur

Se désabonner : {{unsubscribeLink}}`
};

export const DEPANSSUR_EMAIL_DECISION_DOSSIER: DepanssurEmailTemplate = {
  subject: 'Décision concernant votre dossier {{referenceDossier}}',
  html: `
    <h2>Décision sur votre dossier</h2>
    <p>Bonjour {{clientName}},</p>
    <p>Nous avons traité votre dossier <strong>{{referenceDossier}}</strong>.</p>
    <p><strong>Décision :</strong> {{decision}}</p>
    {{#if accepte}}
    <p><strong>Montant pris en charge :</strong> {{montantAccepte}} €</p>
    <p>Le règlement sera effectué dans les 5 jours ouvrés.</p>
    {{else}}
    <p><strong>Motif :</strong> {{motifRefus}}</p>
    {{/if}}
    <p>Cordialement,<br>L'équipe Depanssur</p>
    <p style="font-size:11px;color:#999;margin-top:30px;">
      <a href="{{unsubscribeLink}}">Se désabonner</a>
    </p>
  `,
  text: `Décision sur votre dossier

Bonjour {{clientName}},

Nous avons traité votre dossier {{referenceDossier}}.

Décision : {{decision}}
{{#if accepte}}
Montant pris en charge : {{montantAccepte}} €
Le règlement sera effectué dans les 5 jours ouvrés.
{{else}}
Motif : {{motifRefus}}
{{/if}}

Cordialement,
L'équipe Depanssur

Se désabonner : {{unsubscribeLink}}`
};

export const DEPANSSUR_EMAIL_DUNNING_J0: DepanssurEmailTemplate = {
  subject: 'Échec de prélèvement - Action requise',
  html: `
    <h2>Échec de prélèvement</h2>
    <p>Bonjour {{clientName}},</p>
    <p>Nous n'avons pas pu prélever votre abonnement Depanssur du {{dateEcheance}}.</p>
    <p><strong>Montant :</strong> {{montant}} €</p>
    <p>Une nouvelle tentative sera effectuée automatiquement dans 2 jours.</p>
    <p>Si votre moyen de paiement a changé, merci de mettre à jour vos informations.</p>
    <p>Cordialement,<br>L'équipe Depanssur</p>
    <p style="font-size:11px;color:#999;margin-top:30px;">
      <a href="{{unsubscribeLink}}">Se désabonner</a>
    </p>
  `,
  text: `Échec de prélèvement

Bonjour {{clientName}},

Nous n'avons pas pu prélever votre abonnement Depanssur du {{dateEcheance}}.

Montant : {{montant}} €

Une nouvelle tentative sera effectuée automatiquement dans 2 jours.

Si votre moyen de paiement a changé, merci de mettre à jour vos informations.

Cordialement,
L'équipe Depanssur

Se désabonner : {{unsubscribeLink}}`
};

export const DEPANSSUR_EMAIL_DUNNING_J10: DepanssurEmailTemplate = {
  subject: 'URGENT - Suspension imminente de votre abonnement',
  html: `
    <h2>⚠️ Suspension imminente</h2>
    <p>Bonjour {{clientName}},</p>
    <p>Malgré nos relances, votre abonnement Depanssur présente un impayé depuis 10 jours.</p>
    <p><strong>Montant dû :</strong> {{montant}} €</p>
    <p><strong>Date d'échéance :</strong> {{dateEcheance}}</p>
    <p style="color:red;font-weight:bold;">Votre abonnement sera suspendu si le paiement n'est pas régularisé sous 48h.</p>
    <p>Merci de régulariser votre situation au plus vite.</p>
    <p><a href="{{paymentLink}}" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Mettre à jour mon moyen de paiement</a></p>
    <p>Cordialement,<br>L'équipe Depanssur</p>
    <p style="font-size:11px;color:#999;margin-top:30px;">
      <a href="{{unsubscribeLink}}">Se désabonner</a>
    </p>
  `,
  text: `⚠️ URGENT - Suspension imminente

Bonjour {{clientName}},

Malgré nos relances, votre abonnement Depanssur présente un impayé depuis 10 jours.

Montant dû : {{montant}} €
Date d'échéance : {{dateEcheance}}

⚠️ Votre abonnement sera suspendu si le paiement n'est pas régularisé sous 48h.

Merci de régulariser votre situation au plus vite.

Mettre à jour mon moyen de paiement : {{paymentLink}}

Cordialement,
L'équipe Depanssur

Se désabonner : {{unsubscribeLink}}`
};

/**
 * SMS Templates (max 160 characters)
 */

export const DEPANSSUR_SMS_DUNNING_J5: DepanssurSMSTemplate = {
  message: 'Depanssur: Impayé {{montant}}€. 3e tentative aujourd\'hui. Mettez à jour votre CB: {{paymentLink}}'
};

export const DEPANSSUR_SMS_PLAFOND_DEPASSE: DepanssurSMSTemplate = {
  message: 'Depanssur: Plafond atteint ({{montantUtilise}}/{{plafondAnnuel}}€). Votre prochain dossier sera refusé.'
};

/**
 * Template rendering helper
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}
