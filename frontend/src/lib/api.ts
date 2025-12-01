const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
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

  // Convenience methods
  async get(endpoint: string, options?: ApiOptions) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: unknown, options?: ApiOptions) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: unknown, options?: ApiOptions) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch(endpoint: string, data?: unknown, options?: ApiOptions) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, options?: ApiOptions) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
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

// Export convenience functions
export const api = {
  get: (endpoint: string, options?: ApiOptions) => apiClient.get(endpoint, options),
  post: (endpoint: string, data?: unknown, options?: ApiOptions) => apiClient.post(endpoint, data, options),
  put: (endpoint: string, data?: unknown, options?: ApiOptions) => apiClient.put(endpoint, data, options),
  patch: (endpoint: string, data?: unknown, options?: ApiOptions) => apiClient.patch(endpoint, data, options),
  delete: (endpoint: string, options?: ApiOptions) => apiClient.delete(endpoint, options),
  getBlob: (endpoint: string, options?: ApiOptions) => apiClient.getBlob(endpoint, options),
  setToken: (token: string | null) => apiClient.setToken(token),
  setOnUnauthorized: (callback: () => void) => apiClient.setOnUnauthorized(callback),
};
