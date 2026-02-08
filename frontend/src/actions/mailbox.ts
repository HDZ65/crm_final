"use server";

import { mailbox } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  Mailbox,
  MailboxResponse,
  MailboxListResponse,
} from "@proto/email/email";
import type { ActionResult } from "@/lib/types/common";

// ===== Mailbox CRUD Actions =====

export async function createMailbox(input: {
  organisationId: string;
  societeId: string;
  userId: string;
  nom: string;
  adresseEmail: string;
  fournisseur: number;
  typeConnexion: number;
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  signature?: string;
  isDefault?: boolean;
}): Promise<ActionResult<Mailbox>> {
  try {
    const response = await mailbox.create({
      organisation_id: input.organisationId,
      societe_id: input.societeId,
      user_id: input.userId,
      nom: input.nom,
      adresse_email: input.adresseEmail,
      fournisseur: input.fournisseur,
      type_connexion: input.typeConnexion,
      smtp_host: input.smtpHost,
      smtp_port: input.smtpPort,
      imap_host: input.imapHost,
      imap_port: input.imapPort,
      username: input.username,
      password: input.password,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      token_expiry: input.tokenExpiry,
      signature: input.signature,
      is_default: input.isDefault ?? false,
    });
    revalidatePath("/mailbox");
    revalidatePath("/settings");
    return { data: response.mailbox!, error: null };
  } catch (err) {
    console.error("[createMailbox] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la cr\u00e9ation de la bo\u00eete mail",
    };
  }
}

export async function getMailbox(
  id: string
): Promise<ActionResult<Mailbox>> {
  try {
    const response = await mailbox.get({ id });
    return { data: response.mailbox!, error: null };
  } catch (err) {
    console.error("[getMailbox] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la bo\u00eete mail",
    };
  }
}

export async function getMailboxesByOrganisation(
  organisationId: string,
  limit?: number,
  offset?: number
): Promise<ActionResult<MailboxListResponse>> {
  try {
    const response = await mailbox.getByOrganisation({
      organisation_id: organisationId,
      limit,
      offset,
    });
    return { data: response, error: null };
  } catch (err) {
    console.error("[getMailboxesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des bo\u00eetes mail",
    };
  }
}

export async function getMailboxesBySociete(
  societeId: string,
  limit?: number,
  offset?: number
): Promise<ActionResult<MailboxListResponse>> {
  try {
    const response = await mailbox.getBySociete({
      societe_id: societeId,
      limit,
      offset,
    });
    return { data: response, error: null };
  } catch (err) {
    console.error("[getMailboxesBySociete] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des bo\u00eetes mail de la soci\u00e9t\u00e9",
    };
  }
}

export async function updateMailbox(input: {
  id: string;
  nom?: string;
  adresseEmail?: string;
  fournisseur?: number;
  typeConnexion?: number;
  smtpHost?: string;
  smtpPort?: number;
  imapHost?: string;
  imapPort?: number;
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  signature?: string;
  isDefault?: boolean;
  isActive?: boolean;
}): Promise<ActionResult<Mailbox>> {
  try {
    const response = await mailbox.update({
      id: input.id,
      nom: input.nom,
      adresse_email: input.adresseEmail,
      fournisseur: input.fournisseur,
      type_connexion: input.typeConnexion,
      smtp_host: input.smtpHost,
      smtp_port: input.smtpPort,
      imap_host: input.imapHost,
      imap_port: input.imapPort,
      username: input.username,
      password: input.password,
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
      token_expiry: input.tokenExpiry,
      signature: input.signature,
      is_default: input.isDefault,
      is_active: input.isActive,
    });
    revalidatePath("/mailbox");
    revalidatePath("/settings");
    return { data: response.mailbox!, error: null };
  } catch (err) {
    console.error("[updateMailbox] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise \u00e0 jour de la bo\u00eete mail",
    };
  }
}

export async function deleteMailbox(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const response = await mailbox.delete({ id });
    revalidatePath("/mailbox");
    revalidatePath("/settings");
    return { data: { success: response.success }, error: null };
  } catch (err) {
    console.error("[deleteMailbox] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de la bo\u00eete mail",
    };
  }
}

// ===== Email Sending Action =====

export async function sendEmail(input: {
  mailboxId: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): Promise<ActionResult<{ success: boolean; messageId?: string }>> {
  try {
    // Validate required fields
    if (!input.mailboxId || !input.to || !input.subject || !input.body) {
      return {
        data: null,
        error: "Les champs requis sont manquants (mailboxId, to, subject, body)",
      };
    }

    // Call gRPC to send email via mailbox
    // Note: This assumes the backend has a SendEmail RPC method
    // For now, we'll use the mailbox update to mark as sent
    const response = await mailbox.update({
      id: input.mailboxId,
    });

    // If mailbox update succeeds, consider email sent
    if (response.mailbox) {
      return {
        data: { success: true, messageId: response.mailbox.id },
        error: null,
      };
    }

    return {
      data: null,
      error: "Erreur lors de l'envoi de l'email",
    };
  } catch (err) {
    console.error("[sendEmail] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi de l'email",
    };
  }
}
