import { ApiError, type ApiClient } from './client';

/**
 * REST client for a real PiCode backend. Endpoints mirror `ApiClient` one to one;
 * the mock server documents the expected behaviour of each call.
 */
export function createHttpApi(baseUrl: string): ApiClient {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
    });
    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // Body was not JSON; keep the status text.
      }
      throw new ApiError(message || 'Request failed', response.status);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const post = <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const patch = <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

  return {
    listSessions: () => request('/sessions'),
    createSession: (input) => post('/sessions', input),
    updateSessionSettings: (id, settings) => patch(`/sessions/${id}/settings`, settings),
    forkSession: (id, messageId) => post(`/sessions/${id}/fork`, { messageId }),
    rewindSession: (id, messageId) => post(`/sessions/${id}/rewind`, { messageId }),
    stopAgent: (id) => post(`/sessions/${id}/stop`),
    getConversation: (id) => request(`/sessions/${id}/conversation`),
    sendMessage: (id, input) => post(`/sessions/${id}/messages`, input),
    saveMessageVersion: (messageId, input) => post(`/messages/${messageId}/versions`, input),
    setActiveVersion: (messageId, versionId) =>
      patch(`/messages/${messageId}`, { activeVersionId: versionId }),
    listGoals: () => request('/goals'),
    createGoal: (input) => post('/goals', input),
    getProject: () => request('/project'),
    listModels: () => request('/models'),
    listEnvironments: () => request('/environments'),
  };
}
