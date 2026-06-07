export interface TemplateVaultItem {
  kind: "template";
  entry: string;
  name: string;
  folder: string;
  label?: string;
  faviconUrl: string;
}

export interface PassVaultItem {
  kind: "pass";
  entry: string;
  name: string;
}

export type VaultItem = TemplateVaultItem | PassVaultItem;

export const ALL_FOLDERS = "__all__";
const DOMAIN_PATTERN =
  /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i;

export function cleanEntryPath(entry: string): string {
  return entry.replace(/\\/g, "/").replace(/\.gpg$/i, "");
}

function parseTemplatePath(parts: string[]):
  | {
      folder: string;
      domain: string;
      label?: string;
    }
  | undefined {
  if (parts.length < 2) return undefined;

  const folder = parts[0]?.trim();
  const domain = parts[1]?.trim().toLowerCase();
  const label = parts.slice(2).join("/").trim() || undefined;

  if (!folder || !domain || !DOMAIN_PATTERN.test(domain)) return undefined;

  return { folder, domain, label };
}

export function toVaultItem(entry: string): VaultItem {
  const cleanEntry = cleanEntryPath(entry);
  const parts = cleanEntry.split("/").filter(Boolean);
  const template = parseTemplatePath(parts);

  if (!template) {
    return {
      kind: "pass",
      entry: cleanEntry,
      name: cleanEntry,
    };
  }

  return {
    kind: "template",
    entry: cleanEntry,
    name: template.domain,
    label: template.label,
    faviconUrl: `https://${template.domain}`,
    folder: template.folder,
  };
}
