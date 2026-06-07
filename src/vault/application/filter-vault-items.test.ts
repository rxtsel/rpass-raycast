import assert from "node:assert/strict";
import test from "node:test";
import { ALL_FOLDERS, type VaultItem } from "../domain/vault-item";
import {
  filterVaultItemsByFolder,
  getTemplateVaultItems,
  getVaultFolders,
} from "./filter-vault-items";

const items: VaultItem[] = [
  {
    kind: "template",
    entry: "Acme/github.com/person@example.test",
    name: "github.com",
    folder: "Acme",
    label: "person@example.test",
    faviconUrl: "https://github.com",
  },
  {
    kind: "template",
    entry: "Other/example.com/other",
    name: "example.com",
    folder: "Other",
    label: "other",
    faviconUrl: "https://example.com",
  },
  {
    kind: "template",
    entry: "Acme/gitlab.com/team/admin",
    name: "gitlab.com",
    folder: "Acme",
    label: "team/admin",
    faviconUrl: "https://gitlab.com",
  },
  {
    kind: "pass",
    entry: "personal/social/example-login",
    name: "personal/social/example-login",
  },
];

test("gets root folders only from template items", () => {
  assert.deepEqual(getVaultFolders(getTemplateVaultItems(items)), [
    "Acme",
    "Other",
  ]);
});

test("keeps all items in the all filter", () => {
  assert.deepEqual(filterVaultItemsByFolder(items, ALL_FOLDERS), items);
});

test("filters folder views to template items only", () => {
  assert.deepEqual(filterVaultItemsByFolder(items, "Acme"), [
    items[0],
    items[2],
  ]);
});
