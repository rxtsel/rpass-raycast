import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { getFavicon } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";
import { listEntries } from "../../rpass/application/rpass-client";
import {
  filterVaultItemsByFolder,
  getTemplateVaultItems,
  getVaultFolders,
} from "../application/filter-vault-items";
import { loadVaultItems } from "../application/load-vault-items";
import { ALL_FOLDERS, type VaultItem } from "../domain/vault-item";
import Content from "./content";

interface Props {
  storepath: string;
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

  const templateItems = useMemo(() => getTemplateVaultItems(items), [items]);
  const folders = useMemo(
    () => getVaultFolders(templateItems),
    [templateItems],
  );
  const filteredItems = useMemo(
    () => filterVaultItemsByFolder(items, selectedFolder),
    [items, selectedFolder],
  );
  const folderFilter =
    folders.length > 0 ? (
      <List.Dropdown
        tooltip="Filter by Folder"
        value={selectedFolder}
        onChange={setSelectedFolder}
      >
        <List.Dropdown.Item
          icon={Icon.Folder}
          title="All"
          value={ALL_FOLDERS}
        />
        {folders.map((folder) => (
          <List.Dropdown.Item
            key={folder}
            icon={Icon.Folder}
            title={folder}
            value={folder}
          />
        ))}
      </List.Dropdown>
    ) : undefined;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search vault..."
      searchBarAccessory={folderFilter}
    >
      {filteredItems.map((item) => (
        <List.Item
          key={item.entry}
          icon={item.faviconUrl ? getFavicon(item.faviconUrl) : Icon.Lock}
          title={item.name}
          subtitle={item.kind === "template" ? item.username : undefined}
          accessories={
            item.kind === "template"
              ? [{ tag: { value: item.folder, color: "#8E8E93" } }]
              : undefined
          }
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
