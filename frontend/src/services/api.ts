const getHost = () => {
  if (typeof window === 'undefined') return '127.0.0.1';
  return window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
};

// Use relative path '/api/v1' when in browser to leverage Vite dev proxy and eliminate CORS / Windows IPv6 localhost connection issues
const API_BASE_URL = typeof window !== 'undefined' ? '/api/v1' : `http://${getHost()}:8000/api/v1`;

export function getAuthToken(): string | null {
  return localStorage.getItem('cyvantis_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('cyvantis_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('cyvantis_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired or unauthenticated
    removeAuthToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'API Request failed');
  }

  // If response is file download or no content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export function getWebSocketUrl(token?: string | null): string {
  const host = getHost();
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${host}:8000/api/v1/ws/events`;
  const authToken = token || getAuthToken();
  return authToken ? `${url}?token=${encodeURIComponent(authToken)}` : url;
}

export async function downloadFile(endpoint: string, defaultFilename: string) {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (response.status === 401) {
    removeAuthToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'Download failed');
  }

  let filename = defaultFilename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}
