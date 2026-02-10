"use server";

import { typesActivite } from "@/lib/grpc";
import type {
  TypeActivite,
  ListTypeActiviteResponse,
} from "@proto/activites/activites";
import type { ActionResult } from "@/lib/types/common";

export interface TypeActiviteDto {
  id: string;
  code: string;
  nom: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

function mapTypeActiviteToDto(type: TypeActivite): TypeActiviteDto {
  return {
    id: type.id,
    code: type.code,
    nom: type.nom,
    description: type.description,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
  };
}

export async function listTypesActivite(): Promise<
  ActionResult<TypeActiviteDto[]>
> {
  try {
    const data = await typesActivite.list({
      pagination: { page: 1, limit: 100, sortBy: "nom", sortOrder: "asc" },
    });
    return {
      data: data.types.map(mapTypeActiviteToDto),
      error: null,
    };
  } catch (err) {
    console.error("[listTypesActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des types d'activités",
    };
  }
}

export async function getTypeActivite(
  id: string
): Promise<ActionResult<TypeActiviteDto>> {
  try {
    const data = await typesActivite.get({ id });
    return { data: mapTypeActiviteToDto(data), error: null };
  } catch (err) {
    console.error("[getTypeActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du type d'activité",
    };
  }
}

export async function getTypeActiviteByCode(
  code: string
): Promise<ActionResult<TypeActiviteDto>> {
  try {
    const data = await typesActivite.getByCode({ code });
    return { data: mapTypeActiviteToDto(data), error: null };
  } catch (err) {
    console.error("[getTypeActiviteByCode] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du type d'activité",
    };
  }
}

export async function createTypeActivite(input: {
  code: string;
  nom: string;
  description?: string;
}): Promise<ActionResult<TypeActiviteDto>> {
  try {
    const data = await typesActivite.create({
      code: input.code,
      nom: input.nom,
      description: input.description || "",
    });
    return { data: mapTypeActiviteToDto(data), error: null };
  } catch (err) {
    console.error("[createTypeActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du type d'activité",
    };
  }
}

export async function updateTypeActivite(input: {
  id: string;
  code?: string;
  nom?: string;
  description?: string;
}): Promise<ActionResult<TypeActiviteDto>> {
  try {
    const data = await typesActivite.update({
      id: input.id,
      code: input.code || "",
      nom: input.nom || "",
      description: input.description || "",
    });
    return { data: mapTypeActiviteToDto(data), error: null };
  } catch (err) {
    console.error("[updateTypeActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du type d'activité",
    };
  }
}

export async function deleteTypeActivite(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await typesActivite.delete({ id });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteTypeActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du type d'activité",
    };
  }
}
