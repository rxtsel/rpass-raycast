export interface VaultItem {
  entry: string;
  name: string;
  folder?: string;
  label?: string;
  faviconUrl?: string;
}

export const ALL_FOLDERS = "__all__";
const DOMAIN_PATTERN =
  /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i;

export function cleanEntryPath(entry: string): string {
  return entry.replace(/\\/g, "/").replace(/\.gpg$/i, "");
}

function isDomain(value: string | undefined): value is string {
  return Boolean(value && DOMAIN_PATTERN.test(value));
}

export function toVaultItem(entry: string): VaultItem {
  const cleanEntry = cleanEntryPath(entry);
  const parts = cleanEntry.split("/").filter(Boolean);
  const folder = parts.length > 1 ? parts[0] : undefined;
  const secondPathPart = parts[1]?.trim();

  if (folder && isDomain(secondPathPart)) {
    const domain = secondPathPart.toLowerCase();

    return {
      entry: cleanEntry,
      name: domain,
      folder,
      label: parts.slice(2).join("/").trim() || undefined,
      faviconUrl: `https://${domain}`,
    };
  }

  return {
    entry: cleanEntry,
    name: folder ? parts.slice(1).join("/") : cleanEntry,
    folder,
  };
}
