"use server";

import { auth } from "@/lib/auth/auth.server";
import {
  createProduit,
  getGammesByOrganisation,
  createGamme,
  getProduitsByOrganisation,
} from "@/actions/catalogue";
import {
  TypeProduit,
  CategorieProduit,
  StatutCycleProduit,
} from "@/proto/products/products";
import { ActionResult } from "@/lib/types/common";

/**
 * External product structure from catalogue API
 */
export interface ExternalProduct {
  id: string | number;
  nom: string;
  description?: string;
  categorie?: string;
  fournisseur?: string;
  logo_url?: string;
  prix_base?: number;
  features?: string | null;
  formules?: string | null;
  popular?: boolean;
  rating?: number;
  isActive?: boolean;
}

/**
 * Result of testing catalogue API connection
 */
export interface CatalogueApiTestResult {
  success: boolean;
  productCount: number;
  sampleCategories: string[];
  message: string;
}

/**
 * Result of importing products from catalogue API
 */
export interface CatalogueApiImportResult {
  imported: number;
  skipped: number;
  errors: Array<{
    productId: string | number;
    nom: string;
    error: string;
  }>;
  gammesCreated: number;
}

/**
 * Resolve Bearer token: manual override > session token > none
 */
async function resolveAuthToken(manualToken?: string): Promise<string | undefined> {
  // 1. If a manual token is provided, use it (override)
  if (manualToken?.trim()) {
    return manualToken.trim();
  }

  // 2. Otherwise, try to get the Keycloak token from the current session
  try {
    const session = await auth();
    if (session?.accessToken) {
      return session.accessToken;
    }
  } catch (err) {
    console.warn("[resolveAuthToken] Could not retrieve session token:", err);
  }

  // 3. No token available — call will be made without auth
  return undefined;
}

/**
 * Test connection to external catalogue API
 * Validates JSON structure and returns product count
 */
export async function testCatalogueApiConnection(
  apiUrl: string,
  authToken?: string
): Promise<ActionResult<CatalogueApiTestResult>> {
   try {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 10000);

     const token = await resolveAuthToken(authToken);
     const headers: HeadersInit = {};
     if (token) {
       headers["Authorization"] = `Bearer ${token}`;
     }

     const response = await fetch(apiUrl, {
       signal: controller.signal,
       headers,
     });

     clearTimeout(timeoutId);

     if (!response.ok) {
       const errorMsg = response.status === 401
         ? "Authentification échouée (401) — vérifiez votre token Keycloak"
         : `API returned status ${response.status}`;
       return {
         data: null,
         error: errorMsg,
       };
     }

     const json = await response.json();

    // Parse products from different API response formats
    let products: ExternalProduct[] = [];

    if (Array.isArray(json)) {
      // Format 1: Direct array
      products = json;
    } else if (json.data && Array.isArray(json.data)) {
      // Format 2: { data: [...] }
      products = json.data;
    } else if (json.products && Array.isArray(json.products)) {
      // Format 3: { products: [...] }
      products = json.products;
    } else {
      return {
        data: null,
        error: "API response does not match expected formats (array, {data: [...]}, or {products: [...]})",
      };
    }

    if (!Array.isArray(products) || products.length === 0) {
      return {
        data: null,
        error: "No products found in API response",
      };
    }

    // Extract unique categories
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.categorie) {
        categories.add(p.categorie);
      }
    });

    return {
      data: {
        success: true,
        productCount: products.length,
        sampleCategories: Array.from(categories).slice(0, 5),
        message: `Successfully connected to API. Found ${products.length} products.`,
      },
      error: null,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error during API test";
    console.error("[testCatalogueApiConnection] Error:", err);

    return {
      data: null,
      error: errorMessage,
    };
  }
}

/**
 * Import products from external catalogue API into CRM
 * Creates gammes from categories and products with deduplication
 */
export async function importCatalogueFromApi(params: {
  organisationId: string;
  apiUrl: string;
  authToken?: string;
}): Promise<ActionResult<CatalogueApiImportResult>> {
   try {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 30000);

     const token = await resolveAuthToken(params.authToken);
     const headers: HeadersInit = {};
     if (token) {
       headers["Authorization"] = `Bearer ${token}`;
     }

     const response = await fetch(params.apiUrl, {
       signal: controller.signal,
       headers,
     });

     clearTimeout(timeoutId);

     if (!response.ok) {
       const errorMsg = response.status === 401
         ? "Authentification échouée (401) — vérifiez votre token Keycloak"
         : `API returned status ${response.status}`;
       return {
         data: null,
         error: errorMsg,
       };
     }

     const json = await response.json();

     // Parse products from different API response formats
     let products: ExternalProduct[] = [];

    if (Array.isArray(json)) {
      products = json;
    } else if (json.data && Array.isArray(json.data)) {
      products = json.data;
    } else if (json.products && Array.isArray(json.products)) {
      products = json.products;
    } else {
      return {
        data: null,
        error: "API response does not match expected formats",
      };
    }

    if (!Array.isArray(products) || products.length === 0) {
      return {
        data: null,
        error: "No products found in API response",
      };
    }

    // Load existing gammes for the organisation
    const gammesResult = await getGammesByOrganisation({
      organisationId: params.organisationId,
    });

    if (gammesResult.error) {
      return {
        data: null,
        error: `Failed to load gammes: ${gammesResult.error}`,
      };
    }

    // Build gamme lookup map: lowercase nom -> id
    const gammeMap = new Map<string, string>();
    if (gammesResult.data?.gammes) {
      gammesResult.data.gammes.forEach((gamme) => {
        gammeMap.set(gamme.nom.toLowerCase(), gamme.id);
      });
    }

    // Load existing products for deduplication
    const produitsResult = await getProduitsByOrganisation({
      organisationId: params.organisationId,
    });

    if (produitsResult.error) {
      return {
        data: null,
        error: `Failed to load products: ${produitsResult.error}`,
      };
    }

    // Build set of existing codeExterne values
    const existingCodes = new Set<string>();
    if (produitsResult.data?.produits) {
      produitsResult.data.produits.forEach((p) => {
        if (p.codeExterne) {
          existingCodes.add(p.codeExterne);
        }
      });
    }

    // Import products
    let imported = 0;
    let skipped = 0;
    let gammesCreated = 0;
    const errors: Array<{
      productId: string | number;
      nom: string;
      error: string;
    }> = [];

    for (const externalProduct of products) {
      try {
        const codeExterne = `EXT-${externalProduct.id}`;
        const sku = `EXT-${externalProduct.id}`;

        // Skip if already imported
        if (existingCodes.has(codeExterne)) {
          skipped++;
          continue;
        }

        // Find or create gamme from categorie
        let gammeId: string | null = null;

        if (externalProduct.categorie) {
          const categorieLower = externalProduct.categorie.toLowerCase();
          gammeId = gammeMap.get(categorieLower) || null;

          // Create gamme if it doesn't exist
          if (!gammeId) {
            const createGammeResult = await createGamme({
              organisationId: params.organisationId,
              nom: externalProduct.categorie,
              description: `Imported from external catalogue API`,
            });

            if (createGammeResult.error) {
              errors.push({
                productId: externalProduct.id,
                nom: externalProduct.nom,
                error: `Failed to create gamme: ${createGammeResult.error}`,
              });
              continue;
            }

            gammeId = createGammeResult.data?.id || null;
            if (gammeId) {
              gammeMap.set(categorieLower, gammeId);
              gammesCreated++;
            }
          }
        }

        // Skip if no gamme available
        if (!gammeId) {
          errors.push({
            productId: externalProduct.id,
            nom: externalProduct.nom,
            error: "No gamme available and could not create one",
          });
          continue;
        }

        // Build metadata JSON
        const metadata = JSON.stringify({
          source: "catalogue-rest-api",
          externalId: externalProduct.id,
          fournisseur: externalProduct.fournisseur || null,
          categorieOrigine: externalProduct.categorie || null,
          popular: externalProduct.popular || false,
          rating: externalProduct.rating || 0,
          features: externalProduct.features || null,
          formules: externalProduct.formules || null,
        });

        // Create product
        const createResult = await createProduit({
          organisationId: params.organisationId,
          gammeId,
          nom: externalProduct.nom,
          sku,
          description: externalProduct.description || "",
          type: TypeProduit.PARTENAIRE,
          categorie: CategorieProduit.SERVICE,
          prix: externalProduct.prix_base || 0,
          tauxTva: 20,
          devise: "EUR",
          imageUrl: externalProduct.logo_url || "",
          codeExterne,
          metadata,
          statutCycle: externalProduct.isActive
            ? StatutCycleProduit.STATUT_CYCLE_PRODUIT_ACTIF
            : StatutCycleProduit.STATUT_CYCLE_PRODUIT_RETIRE,
        });

        if (createResult.error) {
          errors.push({
            productId: externalProduct.id,
            nom: externalProduct.nom,
            error: createResult.error,
          });
          continue;
        }

        imported++;
        existingCodes.add(codeExterne);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown error";
        errors.push({
          productId: externalProduct.id,
          nom: externalProduct.nom,
          error: errorMsg,
        });
      }
    }

    return {
      data: {
        imported,
        skipped,
        errors,
        gammesCreated,
      },
      error: null,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error during import";
    console.error("[importCatalogueFromApi] Error:", err);

    return {
      data: null,
      error: errorMessage,
    };
  }
}
