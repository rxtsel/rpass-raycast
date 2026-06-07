import { ALL_FOLDERS, type VaultItem } from "../domain/vault-item";

export function getVaultFolders(items: VaultItem[]): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => item.folder)
        .filter((folder): folder is string => Boolean(folder)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function vaultItemMatchesFolder(
  item: VaultItem,
  selectedFolder: string,
): boolean {
  if (selectedFolder === ALL_FOLDERS) return true;
  return item.folder === selectedFolder;
}

export function filterVaultItemsByFolder(
  items: VaultItem[],
  selectedFolder: string,
): VaultItem[] {
  return items.filter((item) => vaultItemMatchesFolder(item, selectedFolder));
}
