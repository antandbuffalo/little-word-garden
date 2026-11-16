export const TOKEN_KEY = 'little-word-garden-admin-token';

export function tokenStore(storage = () => globalThis.localStorage) {
  return {
    load() {
      try { return storage().getItem(TOKEN_KEY) || ''; } catch { return ''; }
    },
    save(token) {
      try { storage().setItem(TOKEN_KEY, token); return true; } catch { return false; }
    },
    clear() {
      try { storage().removeItem(TOKEN_KEY); return true; } catch { return false; }
    },
  };
}
