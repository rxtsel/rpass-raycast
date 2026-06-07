import {
	ALL_FOLDERS,
	type TemplateVaultItem,
	type VaultItem,
} from "../domain/vault-item";

export function getTemplateVaultItems(items: VaultItem[]): TemplateVaultItem[] {
	return items.filter(
		(item): item is TemplateVaultItem => item.kind === "template",
	);
}

export function getVaultFolders(items: TemplateVaultItem[]): string[] {
	return Array.from(new Set(items.map((item) => item.folder))).sort((a, b) =>
		a.localeCompare(b),
	);
}

export function vaultItemMatchesFolder(
	item: VaultItem,
	selectedFolder: string,
): boolean {
	if (selectedFolder === ALL_FOLDERS) return true;
	if (item.kind !== "template") return false;
	return item.folder === selectedFolder;
}

export function filterVaultItemsByFolder(
	items: VaultItem[],
	selectedFolder: string,
): VaultItem[] {
	return items.filter((item) => vaultItemMatchesFolder(item, selectedFolder));
}
