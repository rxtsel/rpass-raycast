export const GPG_REPROMPT_IMMEDIATELY = 0;
export const GPG_REPROMPT_UNTIL_RAYCAST_QUITS = -1;
export const DEFAULT_GPG_REPROMPT_DURATION_MS = 4 * 60 * 60 * 1000;

interface UnlockMarkerStorage {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear?(): void;
}

interface UnlockMarkerPayload {
  expiresAt: number;
}

interface UnlockSessionOptions {
  storage?: UnlockMarkerStorage;
  now?: () => number;
  defaultTtlMs?: number;
}

const memoryStorage = new Map<string, string>();

const defaultStorage: UnlockMarkerStorage = {
  get: (key) => memoryStorage.get(key),
  set: (key, value) => memoryStorage.set(key, value),
  remove: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};

function storeKey(storeDir: string): string {
  return `rpass:gpg-unlock:${storeDir.trim()}`;
}

function parseMarker(value: string): UnlockMarkerPayload | undefined {
  try {
    const parsed = JSON.parse(value) as Partial<UnlockMarkerPayload>;
    return typeof parsed.expiresAt === "number"
      ? { expiresAt: parsed.expiresAt }
      : undefined;
  } catch {
    return undefined;
  }
}

export function parseGpgRepromptDuration(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : DEFAULT_GPG_REPROMPT_DURATION_MS;
}

export function createGpgUnlockSession(options: UnlockSessionOptions = {}) {
  const storage = options.storage ?? defaultStorage;
  const now = options.now ?? Date.now;
  const defaultTtlMs = options.defaultTtlMs ?? DEFAULT_GPG_REPROMPT_DURATION_MS;

  function markStoreUnlocked(storeDir: string, ttlMs = defaultTtlMs): void {
    if (ttlMs === GPG_REPROMPT_IMMEDIATELY) {
      storage.remove(storeKey(storeDir));
      return;
    }

    storage.set(
      storeKey(storeDir),
      JSON.stringify({
        expiresAt:
          ttlMs === GPG_REPROMPT_UNTIL_RAYCAST_QUITS
            ? Number.MAX_SAFE_INTEGER
            : now() + ttlMs,
      } satisfies UnlockMarkerPayload),
    );
  }

  function forgetStoreUnlock(storeDir: string): void {
    storage.remove(storeKey(storeDir));
  }

  function shouldTryAgentUnlock(storeDir: string): boolean {
    const key = storeKey(storeDir);
    const marker = storage.get(key);
    if (!marker) return false;

    const parsed = parseMarker(marker);
    if (!parsed || parsed.expiresAt <= now()) {
      storage.remove(key);
      return false;
    }

    return true;
  }

  function resetUnlockSessionForTests(): void {
    storage.clear?.();
  }

  return {
    markStoreUnlocked,
    forgetStoreUnlock,
    shouldTryAgentUnlock,
    resetUnlockSessionForTests,
  };
}

export const {
  markStoreUnlocked,
  forgetStoreUnlock,
  shouldTryAgentUnlock,
  resetUnlockSessionForTests,
} = createGpgUnlockSession();
