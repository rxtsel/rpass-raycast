import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listEntries,
  removeEntry,
  RpassError,
} from "../../rpass/application/rpass-client";
import {
  filterVaultItemsByFolder,
  getVaultFolders,
} from "../application/filter-vault-items";
import { loadVaultItems } from "../application/load-vault-items";
import { ALL_FOLDERS, type VaultItem } from "../domain/vault-item";
import Content from "./content";

const FOLDER_TAG_COLOR = "#8E8E93";

interface Props {
  storepath: string;
}

function getVaultItemIcon(item: VaultItem) {
  return item.faviconUrl ? getFavicon(item.faviconUrl) : Icon.Lock;
}

function getVaultItemAccessories(item: VaultItem) {
  return item.folder
    ? [{ tag: { value: item.folder, color: FOLDER_TAG_COLOR } }]
    : undefined;
}

interface FolderFilterProps {
  folders: string[];
  selectedFolder: string;
  onChange(folder: string): void;
}

function formatError(error: unknown): string {
  if (error instanceof RpassError) {
    return `${error.code}: ${error.message}${error.details ? `\n\n${error.details}` : ""}`;
  }

  if (error instanceof Error) return error.message;
  return String(error);
}

function FolderFilter({
  folders,
  selectedFolder,
  onChange,
}: FolderFilterProps) {
  if (folders.length === 0) return null;

  return (
    <List.Dropdown
      tooltip="Filter by Folder"
      value={selectedFolder}
      onChange={onChange}
    >
      <List.Dropdown.Item icon={Icon.Folder} title="All" value={ALL_FOLDERS} />
      {folders.map((folder) => (
        <List.Dropdown.Item
          key={folder}
          icon={Icon.Folder}
          title={folder}
          value={folder}
        />
      ))}
    </List.Dropdown>
  );
}

export default function Store({ storepath }: Props) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState(ALL_FOLDERS);
  const [lastError, setLastError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLastError(undefined);
    try {
      setItems(await loadVaultItems(storepath, { listEntries }));
    } catch (error) {
      setLastError(formatError(error));
    } finally {
      setIsLoading(false);
    }
  }, [storepath]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteEntry = useCallback(
    async (item: VaultItem) => {
      const confirmed = await confirmAlert({
        title: "Delete Entry?",
        message: `Delete '${item.entry}' from the password store? This cannot be undone.`,
        primaryAction: {
          title: "Delete Entry",
          style: Alert.ActionStyle.Destructive,
        },
        dismissAction: {
          title: "Cancel",
        },
      });

      if (!confirmed) return;

      setIsLoading(true);
      setLastError(undefined);
      try {
        await removeEntry(item.entry, storepath);
        setItems((currentItems) =>
          currentItems.filter(
            (currentItem) => currentItem.entry !== item.entry,
          ),
        );
        await showToast(Toast.Style.Success, "Entry Deleted", item.entry);
      } catch (error) {
        const message = formatError(error);
        setLastError(message);
        await showToast(Toast.Style.Failure, "Failed to Delete Entry", message);
      } finally {
        setIsLoading(false);
      }
    },
    [storepath],
  );

  const folders = useMemo(() => getVaultFolders(items), [items]);
  const filteredItems = useMemo(
    () => filterVaultItemsByFolder(items, selectedFolder),
    [items, selectedFolder],
  );

  if (lastError) {
    return (
      <List isLoading={isLoading}>
        <List.Item
          icon={Icon.ExclamationMark}
          title="Failed to Load Vault"
          subtitle={lastError}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy Error" content={lastError} />
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={load}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search vault..."
      searchBarAccessory={
        <FolderFilter
          folders={folders}
          selectedFolder={selectedFolder}
          onChange={setSelectedFolder}
        />
      }
    >
      {filteredItems.map((item) => (
        <List.Item
          key={item.entry}
          icon={getVaultItemIcon(item)}
          title={item.name}
          subtitle={item.label}
          accessories={getVaultItemAccessories(item)}
          actions={
            <ActionPanel>
              <Action.Push
                title="Show Entry"
                target={<Content storepath={storepath} entry={item.entry} />}
              />
              <Action
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                title="Delete Entry"
                onAction={() => deleteEntry(item)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
