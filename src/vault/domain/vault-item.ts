export interface TemplateVaultItem {
  kind: "template";
  entry: string;
  name: string;
  folder: string;
  username: string;
  faviconUrl: string;
}

export interface PassVaultItem {
  kind: "pass";
  entry: string;
  name: string;
}

export type VaultItem = TemplateVaultItem | PassVaultItem;

export const ALL_FOLDERS = "__all__";
const TEMPLATE_SEPARATOR = "__";
const DOMAIN_PATTERN =
  /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i;

export function cleanEntryPath(entry: string): string {
  return entry.replace(/\\/g, "/").replace(/\.gpg$/i, "");
}

function parseTemplateName(name: string):
  | {
      domain: string;
      username: string;
    }
  | undefined {
  const separatorIndex = name.indexOf(TEMPLATE_SEPARATOR);
  if (separatorIndex <= 0) return undefined;

  const domain = name.slice(0, separatorIndex).trim().toLowerCase();
  const username = name
    .slice(separatorIndex + TEMPLATE_SEPARATOR.length)
    .trim();

  if (!domain || !username || !DOMAIN_PATTERN.test(domain)) return undefined;

  return { domain, username };
}

export function toVaultItem(entry: string): VaultItem {
  const cleanEntry = cleanEntryPath(entry);
  const parts = cleanEntry.split("/").filter(Boolean);
  const fileName = parts.at(-1) ?? cleanEntry;
  const folderParts = parts.slice(0, -1);
  const template = parseTemplateName(fileName);
  const folder = folderParts.join("/");

  if (!template || !folder) {
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
    username: template.username,
    faviconUrl: `https://${template.domain}`,
    folder,
  };
}
