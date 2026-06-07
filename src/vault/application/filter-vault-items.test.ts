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
    entry: "Acme/github.com__person@example.test",
    name: "github.com",
    folder: "Acme",
    username: "person@example.test",
    faviconUrl: "https://github.com",
  },
  {
    kind: "template",
    entry: "Other/example.com__other",
    name: "example.com",
    folder: "Other",
    username: "other",
    faviconUrl: "https://example.com",
  },
  {
    kind: "pass",
    entry: "personal/social/example-login",
    name: "personal/social/example-login",
  },
];

test("gets folders only from template items", () => {
  assert.deepEqual(getVaultFolders(getTemplateVaultItems(items)), [
    "Acme",
    "Other",
  ]);
});

test("keeps all items in the all filter", () => {
  assert.deepEqual(filterVaultItemsByFolder(items, ALL_FOLDERS), items);
});

test("filters folder views to template items only", () => {
  assert.deepEqual(filterVaultItemsByFolder(items, "Acme"), [items[0]]);
});
