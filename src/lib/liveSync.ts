const CHANNEL_NAME = 'tunn_cms_live_sync_v1';
const STORAGE_PING_KEY = 'tunn_cms_sync_ping_v1';

export type LiveSyncScope = 'cms' | 'themes' | 'feedback' | 'all';

export function broadcastLiveSync(scope: LiveSyncScope = 'all') {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      ch.postMessage({ scope, ts: Date.now() });
      ch.close();
    }
  } catch {
    // ignore BroadcastChannel errors
  }

  try {
    localStorage.setItem(
      STORAGE_PING_KEY,
      JSON.stringify({ scope, ts: Date.now(), rand: Math.random() })
    );
  } catch {
    // ignore storage errors
  }
}

export function subscribeLiveSync(
  onSync: (scope: LiveSyncScope) => void
): () => void {
  let ch: BroadcastChannel | null = null;

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel(CHANNEL_NAME);
      ch.onmessage = (event) => {
        const scope = (event.data?.scope as LiveSyncScope) || 'all';
        onSync(scope);
      };
    }
  } catch {
    ch = null;
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_PING_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue);
      onSync((parsed?.scope as LiveSyncScope) || 'all');
    } catch {
      onSync('all');
    }
  };

  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
    try {
      ch?.close();
    } catch {
      // ignore
    }
  };
}
