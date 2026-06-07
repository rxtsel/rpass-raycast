import assert from "node:assert/strict";
import test from "node:test";
import { cleanEntryPath, toVaultItem } from "./vault-item";

test("parses template entries without decrypting vault content", () => {
  assert.deepEqual(toVaultItem("Acme/github.com__person@example.test.gpg"), {
    kind: "template",
    entry: "Acme/github.com__person@example.test",
    name: "github.com",
    folder: "Acme",
    username: "person@example.test",
    faviconUrl: "https://github.com",
  });
});

test("keeps pass-compatible entries as full path fallback", () => {
  assert.deepEqual(toVaultItem("personal/social/example-login.gpg"), {
    kind: "pass",
    entry: "personal/social/example-login",
    name: "personal/social/example-login",
  });
});

test("ignores invalid template domains", () => {
  assert.deepEqual(toVaultItem("Personal/not-a-domain__person.gpg"), {
    kind: "pass",
    entry: "Personal/not-a-domain__person",
    name: "Personal/not-a-domain__person",
  });
});

test("requires a folder for template entries", () => {
  assert.deepEqual(toVaultItem("github.com__person@example.test.gpg"), {
    kind: "pass",
    entry: "github.com__person@example.test",
    name: "github.com__person@example.test",
  });
});

test("normalizes windows paths and strips gpg suffix", () => {
  assert.equal(
    cleanEntryPath("Work\\example.com__user.gpg"),
    "Work/example.com__user",
  );
});
