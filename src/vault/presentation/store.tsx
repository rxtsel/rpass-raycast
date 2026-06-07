import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";
import { listEntries } from "../../rpass/application/rpass-client";
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

function FolderFilter({ folders, selectedFolder, onChange }: FolderFilterProps) {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVaultItems(storepath, { listEntries })
      .then(setItems)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [storepath]);

  const folders = useMemo(() => getVaultFolders(items), [items]);
  const filteredItems = useMemo(
    () => filterVaultItemsByFolder(items, selectedFolder),
    [items, selectedFolder],
  );

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
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
