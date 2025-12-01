import { translateBackendError, extractValidationErrors } from './error-messages';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  /** Message d'erreur traduit pour l'utilisateur */
  public userMessage: string;
  /** Erreurs de validation par champ (si applicable) */
  public validationErrors: Record<string, string[]> | null;

  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.userMessage = translateBackendError(message, status);
    this.validationErrors = extractValidationErrors(response);
  }

  /**
   * Retourne le message à afficher à l'utilisateur
   */
  getUserMessage(): string {
    return this.userMessage;
  }

  /**
   * Vérifie si l'erreur contient des erreurs de validation
   */
  hasValidationErrors(): boolean {
    return this.validationErrors !== null && Object.keys(this.validationErrors).length > 0;
  }

  /**
   * Retourne les erreurs de validation pour un champ spécifique
   */
  getFieldErrors(fieldName: string): string[] {
    return this.validationErrors?.[fieldName] || [];
  }
}

class ApiClient {
  private token: string | null = null;
  private onUnauthorized?: () => void;

  setToken(token: string | null) {
    this.token = token;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  async request(endpoint: string, options: ApiOptions = {}) {
    const { skipAuth = false, ...fetchOptions } = options;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Add authorization header if not skipping auth
    if (!skipAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Construct full URL
    const url = `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.error('Unauthorized - token may be expired or invalid');
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new ApiError('Unauthorized', 401);
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        throw new ApiError('Forbidden - insufficient permissions', 403);
      }

      // Handle non-2xx responses
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;

        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = await response.text() || errorMessage;
          }
        } catch {
          // If parsing fails, use default error message
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Parse JSON response if content-type is application/json
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error(`API request failed for ${endpoint}:`, error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // Convenience methods with generic type support
  async get<T = unknown>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request(endpoint, { ...options, method: 'GET' }) as Promise<T>;
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>;
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>;
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>;
  }

  async delete<T = unknown>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request(endpoint, { ...options, method: 'DELETE' }) as Promise<T>;
  }

  async getBlob(endpoint: string, options: ApiOptions = {}): Promise<Blob | null> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (!skipAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method: 'GET',
        headers,
      });

      if (response.status === 401) {
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new ApiError('Unauthorized', 401);
      }

      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error(`API blob request failed for ${endpoint}:`, error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Export convenience functions with generic type support
export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiOptions): Promise<T> => apiClient.get<T>(endpoint, options),
  post: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> => apiClient.post<T>(endpoint, data, options),
  put: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> => apiClient.put<T>(endpoint, data, options),
  patch: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions): Promise<T> => apiClient.patch<T>(endpoint, data, options),
  delete: <T = unknown>(endpoint: string, options?: ApiOptions): Promise<T> => apiClient.delete<T>(endpoint, options),
  getBlob: (endpoint: string, options?: ApiOptions) => apiClient.getBlob(endpoint, options),
  setToken: (token: string | null) => apiClient.setToken(token),
  setOnUnauthorized: (callback: () => void) => apiClient.setOnUnauthorized(callback),
};
