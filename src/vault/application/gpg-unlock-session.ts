const unlockedStoreDirs = new Set<string>();

function storeKey(storeDir: string): string {
  return storeDir.trim();
}

export function markStoreUnlocked(storeDir: string): void {
  unlockedStoreDirs.add(storeKey(storeDir));
}

export function forgetStoreUnlock(storeDir: string): void {
  unlockedStoreDirs.delete(storeKey(storeDir));
}

export function shouldTryAgentUnlock(storeDir: string): boolean {
  return unlockedStoreDirs.has(storeKey(storeDir));
}

export function resetUnlockSessionForTests(): void {
  unlockedStoreDirs.clear();
}
