import { Cache } from "@raycast/api";
import {
  createGpgUnlockSession,
  GPG_REPROMPT_IMMEDIATELY,
  GPG_REPROMPT_UNTIL_RAYCAST_QUITS,
} from "../application/gpg-unlock-session";

const cache = new Cache({
  namespace: "gpg-unlock-session",
  capacity: 1024,
});

const persistentSession = createGpgUnlockSession({
  storage: {
    get: (key) => cache.get(key),
    set: (key, value) => cache.set(key, value),
    remove: (key) => cache.remove(key),
  },
});

const processSession = createGpgUnlockSession();

export function markStoreUnlocked(storeDir: string, ttlMs: number): void {
  if (ttlMs === GPG_REPROMPT_IMMEDIATELY) {
    forgetStoreUnlock(storeDir);
    return;
  }

  if (ttlMs === GPG_REPROMPT_UNTIL_RAYCAST_QUITS) {
    processSession.markStoreUnlocked(storeDir, ttlMs);
    persistentSession.forgetStoreUnlock(storeDir);
    return;
  }

  persistentSession.markStoreUnlocked(storeDir, ttlMs);
  processSession.forgetStoreUnlock(storeDir);
}

export function forgetStoreUnlock(storeDir: string): void {
  persistentSession.forgetStoreUnlock(storeDir);
  processSession.forgetStoreUnlock(storeDir);
}

export function shouldTryAgentUnlock(storeDir: string, ttlMs: number): boolean {
  if (ttlMs === GPG_REPROMPT_IMMEDIATELY) return false;

  if (ttlMs === GPG_REPROMPT_UNTIL_RAYCAST_QUITS) {
    return processSession.shouldTryAgentUnlock(storeDir);
  }

  return persistentSession.shouldTryAgentUnlock(storeDir);
}
