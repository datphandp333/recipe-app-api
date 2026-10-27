export const isMeteredPath = path => /\/api\/ai\/recipes\/(chat|generate|second-serving)(?:\?|$)/.test(path)
  || /\/api\/pantry\/(scan|meal-plans\/drafts)(?:\?|$)/.test(path);

export function createBetaClient({ fetchImpl, randomId, hashBody }) {
  let session = null;
  const pendingIds = new Map();
  return {
    bind(value) {
      if (session?.userId !== value?.userId) pendingIds.clear();
      session = value;
    },
    async fetch(url, options = {}) {
      const current = session;
      const metered = isMeteredPath(url) && (options.method || 'GET').toUpperCase() === 'POST';
      const favorites = /\/api\/favorites(?:\/|\?|$)/.test(url);
      if (!metered && !favorites) return fetchImpl(url, options);
      if (favorites) {
        if (!current?.userId) throw new Error('Sign in to open your cookbook.');
        const token = await current.getToken();
        if (session !== current || !token) throw new Error('Your session changed. Please sign in again.');
        const headers = new Headers(options.headers);
        headers.set('Authorization', `Bearer ${token}`);
        const response = await fetchImpl(url, { ...options, headers });
        if (session !== current) throw new Error('Your session changed. Please reopen this screen.');
        return response;
      }
      if (!current?.userId) throw new Error('Sign in to use AI features.');
      const token = await current.getToken();
      if (session !== current || !token) throw new Error('Your session changed. Please sign in again.');
      const digest = await hashBody(options.body || '');
      if (session !== current) throw new Error('Your session changed. Please reopen this screen.');
      const key = `${current.userId}:${url}:${digest}`;
      let requestId = pendingIds.get(key);
      if (!requestId) {
        requestId = randomId();
        pendingIds.set(key, requestId);
      }
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('X-Request-Id', requestId);
      const response = await fetchImpl(url, { ...options, headers });
      if (session !== current) throw new Error('Your session changed. Please reopen this screen.');
      const data = await response.clone().json().catch(() => null);
      // Only explicit results release a retry identifier. Network errors keep it.
      if (response.ok || (response.status < 500 && data?.code !== 'request_pending')
          || (response.status >= 500 && data?.code !== 'allowance_unavailable')) pendingIds.delete(key);
      if (data?.code === 'quota_exceeded') current.onQuota?.(data);
      return response;
    },
  };
}
